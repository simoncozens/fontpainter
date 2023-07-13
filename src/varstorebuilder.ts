import { Support, VariationModel } from "./varmodel"

function _getLocationKey(s: Support) :string {
    return JSON.stringify(s)
}

// These next few classes will be passed to fontkit/restructure so we
// use accessor names which match those used in fontkit.
interface RegionAxisCoordinates {
    startCoord: number
    peakCoord: number
    endCoord: number
}

type VarRegion = RegionAxisCoordinates[]

function buildVarRegion(support: Support, axisTags: string[]) : VarRegion {
    let region : VarRegion = []
    for (let tag of axisTags) {
        let [startCoord, peakCoord, endCoord] = support[tag] || [0,0,0]
        region.push({startCoord, peakCoord, endCoord})
    }
    return region
}

class VariationRegionList {
    variationRegions: VarRegion[]
    regionCount: number = 0
    axisCount: number

    constructor(regions: VarRegion[], axisTags: string[]) {
        this.variationRegions = regions
        this.regionCount = regions.length
        this.axisCount = axisTags.length
    }
}

class VarStore {
    format: number = 1
    variationRegionList: VariationRegionList
    variationDataCount: number = 0
    itemVariationData: VarData[]

    constructor(regionList: VariationRegionList, varData: VarData[]) {
        this.variationRegionList = regionList
        this.itemVariationData = varData
    }
}

let bitLength = (n: number) => Math.floor(Math.log2(Math.abs(n))) + 1

class VarData {
    itemCount: number = 0
    shortDeltaCount: number = 0
    regionIndexCount = 0
    regionIndexes: number[] = []
    deltaSets: number[][] = []

    constructor(varRegionIndices: number[], items: number[][], optimize: boolean=true) {
        this.regionIndexes = [...varRegionIndices]
        this.regionIndexCount = varRegionIndices.length
        for (var item of items) {
            console.assert(item.length == varRegionIndices.length)
        }
        this.itemCount = items.length
        this.deltaSets = [...items]
        this.calculateNumShorts(optimize)
    }

    calculateNumShorts(optimize: boolean = false) {
        let count = this.regionIndexCount
        let items = this.deltaSets
        let bitLengths = new Array(count).fill(0)
        for (let item of items) {
            let bl = item.map(i => bitLength(i + Number(i < -1)))
            bitLengths = bl.map((b, i) => Math.max(b, bitLengths[i]))
        }
        let byte_lengths = bitLengths.map(b => (b + 8) >> 3)
        let longWords = false
        for (var length of byte_lengths) {
            if (length > 2) {
                longWords = true
                break
            }
        }

        if (optimize) {
            let mapping: number[] = []
            mapping.push(...byte_lengths.map((_, i) => i).filter(i => byte_lengths[i] > 2))
            mapping.push(...byte_lengths.map((_, i) => i).filter(i => byte_lengths[i] == 2))
            mapping.push(...byte_lengths.map((_, i) => i).filter(i => byte_lengths[i] == 1))
            // XXX
        }

        if (longWords) {
            this.shortDeltaCount = (
                Math.max(...byte_lengths.map((_, i) => i).filter(i => byte_lengths[i] > 2)) + 1
            )
            this.shortDeltaCount |= 0x8000
        }
        else {
            this.shortDeltaCount = (
                Math.max(...byte_lengths.map((_, i) => i).filter(i => byte_lengths[i] > 1)) + 1
            )
        }
        this.regionIndexCount = this.regionIndexes.length
        return this
    }
    addItem(deltas: number[]) {
        deltas = deltas.map(d => Math.round(d))
        let countUs = this.regionIndexCount
        let countThem = deltas.length
        if (countUs + 1 == countThem) {
            deltas = deltas.slice(1)
        } else {
            console.assert(countUs == countThem)
        }
        this.deltaSets.push([...deltas])
        this.itemCount = this.deltaSets.length
    }
}

export class VarStoreBuilder {
    _axisTags: string[]
    _regionMap: Map<string, number>
    _regionList: VariationRegionList
    _store: VarStore
    _data: VarData | null = null
    _model: VariationModel | null = null
    _supports: Support[]
    _varDataIndices: Map<string, number>
    _varDataCaches: Map<string, Map<string, any>>
    _cache: Map<string, any>
    _outer: number | null = null

    constructor(axisTags: string[]) {
        this._axisTags = axisTags
        this._regionMap = new Map()
        this._regionList = new VariationRegionList([], axisTags)
        this._store = new VarStore(this._regionList, [])
        this._supports = []
        this._varDataIndices = new Map()
        this._varDataCaches = new Map()
        this._cache = new Map()
    }

    setModel(model: VariationModel) {
        this.setSupports(model.supports)
        this._model = model
    }

    setSupports(supports: Support[]) {
        this._model = null
        this._supports = [...supports]
        if (Object.keys(this._supports[0]).length === 0) {
            this._supports.shift() // Drop base master support
        }
        this._cache = new Map()
        this._data = null
    }

    finish(optimize: boolean = true): VarStore {
        this._regionList.regionCount = this._regionList.variationRegions.length
        this._store.variationDataCount = this._store.itemVariationData.length
        for (let data of this._store.itemVariationData) {
            data.itemCount = data.deltaSets.length
            data.calculateNumShorts(optimize)
        }
        return this._store
    }

    _add_VarData() {
        let regionMap = this._regionMap
        let regionList = this._regionList
        let regions = this._supports
        let regionIndices = []
        for (let region of regions) {
            let key = _getLocationKey(region)
            let idx = regionMap.get(key)
            if (idx === undefined) {
                let varRegion = buildVarRegion(region, this._axisTags)
                idx = regionList.variationRegions.length
                regionMap.set(key, idx)
                regionList.variationRegions.push(varRegion)
            }
            regionIndices.push(idx!)
        }

        // Check if we have one already...
        let key = regionIndices.join(",")
        let varDataIdx : number | undefined = this._varDataIndices.get(key);
        if (varDataIdx !== undefined) {
            this._data = this._store.itemVariationData[varDataIdx]
            this._cache = this._varDataCaches.get(key)!
            if (this._data.deltaSets.length === 0xFFFF) {
                // This is full.  Need new one.
                varDataIdx = undefined
            }
        }

        if (varDataIdx === undefined) {
            this._data = new VarData(regionIndices, [], false)
            this._outer = this._store.itemVariationData.length
            this._store.itemVariationData.push(this._data)
            this._varDataIndices.set(key, this._outer!)
            if (!this._varDataCaches.has(key)) {
                this._varDataCaches.set(key, new Map());
            }
            this._cache = this._varDataCaches.get(key)!
        }
    }

    storeMasters(masterValues: number[]) : [number | undefined, number] {
        let deltas = this._model!.getDeltas(masterValues)
        let base = deltas.shift()
        return [base, this.storeDeltas(deltas)]
    }

    storeDeltas(deltas: number[]) :number {
        deltas = deltas.map(d => Math.round(d))
        if (deltas.length === this._supports.length + 1) {
            deltas = deltas.slice(1)
        }
        let key = deltas.join(",")
        let varIdx = this._cache.get(key)
        if (varIdx !== undefined) {
            return varIdx
        }

        if (!this._data) {
            this._add_VarData()
        }
        let inner = this._data!.deltaSets.length
        if (inner === 0xFFFF) {
            // Full array. Start new one.
            this._add_VarData()
            return this.storeDeltas(deltas)
        }
        this._data!.addItem(deltas)

        console.assert(this._outer !== null, "outer mapping not set")

        varIdx = (this._outer! << 16) + inner
        this._cache.set(key, varIdx)
        return varIdx
    }
}

export function computeDeltaSetEntryFormat(mapping: any[]) {
    let ored = 0;
    for (var idx of mapping) {
        ored |= idx.entry
    }
    let inner = ored & 0xFFFF
    let innerBits = 0
    while (inner) {
        innerBits += 1
        inner >>= 1
    }
    innerBits = Math.max(innerBits, 1)
    console.assert(innerBits <= 16)

    ored = (ored >> (16 - innerBits)) | (ored & ((1 << innerBits) - 1))
    let entrySize = 1;
    if (ored  <= 0x000000FF) {
        entrySize = 1
    } else if (ored <= 0x0000FFFF) {
        entrySize = 2
    } else if (ored <= 0x00FFFFFF) {
        entrySize = 3
    } else {
        entrySize = 4
    }

    return ((entrySize - 1) << 4) | (innerBits - 1)
}
