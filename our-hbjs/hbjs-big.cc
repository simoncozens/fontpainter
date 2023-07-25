#include "harfbuzz/src/graph/gsubgpos-context.cc"
#include "harfbuzz/src/hb-aat-layout.cc"
#include "harfbuzz/src/hb-aat-map.cc"
#include "harfbuzz/src/hb-blob.cc"
#include "harfbuzz/src/hb-buffer-serialize.cc"
#include "harfbuzz/src/hb-buffer-verify.cc"
#include "harfbuzz/src/hb-buffer.cc"
#include "harfbuzz/src/hb-common.cc"
#include "harfbuzz/src/hb-draw.cc"
#include "harfbuzz/src/hb-face-builder.cc"
#include "harfbuzz/src/hb-face.cc"
#include "harfbuzz/src/hb-fallback-shape.cc"
#include "harfbuzz/src/hb-font.cc"
#include "harfbuzz/src/hb-map.cc"
#include "harfbuzz/src/hb-number.cc"
#include "harfbuzz/src/hb-ot-cff1-table.cc"
#include "harfbuzz/src/hb-ot-cff2-table.cc"
#include "harfbuzz/src/hb-ot-color.cc"
#include "harfbuzz/src/hb-ot-face.cc"
#include "harfbuzz/src/hb-ot-font.cc"
#include "harfbuzz/src/hb-ot-layout.cc"
#include "harfbuzz/src/hb-ot-map.cc"
#include "harfbuzz/src/hb-ot-math.cc"
#include "harfbuzz/src/hb-ot-meta.cc"
#include "harfbuzz/src/hb-ot-metrics.cc"
#include "harfbuzz/src/hb-ot-name.cc"
#include "harfbuzz/src/hb-ot-shape-fallback.cc"
#include "harfbuzz/src/hb-ot-shape-normalize.cc"
#include "harfbuzz/src/hb-ot-shape.cc"
#include "harfbuzz/src/hb-ot-shaper-arabic.cc"
#include "harfbuzz/src/hb-ot-shaper-default.cc"
#include "harfbuzz/src/hb-ot-shaper-hangul.cc"
#include "harfbuzz/src/hb-ot-shaper-hebrew.cc"
#include "harfbuzz/src/hb-ot-shaper-indic-table.cc"
#include "harfbuzz/src/hb-ot-shaper-indic.cc"
#include "harfbuzz/src/hb-ot-shaper-khmer.cc"
#include "harfbuzz/src/hb-ot-shaper-myanmar.cc"
#include "harfbuzz/src/hb-ot-shaper-syllabic.cc"
#include "harfbuzz/src/hb-ot-shaper-thai.cc"
#include "harfbuzz/src/hb-ot-shaper-use.cc"
#include "harfbuzz/src/hb-ot-shaper-vowel-constraints.cc"
#include "harfbuzz/src/hb-ot-tag.cc"
#include "harfbuzz/src/hb-ot-var.cc"
#include "harfbuzz/src/hb-outline.cc"
#include "harfbuzz/src/hb-paint-extents.cc"
#include "harfbuzz/src/hb-paint.cc"
#include "harfbuzz/src/hb-set.cc"
#include "harfbuzz/src/hb-shape-plan.cc"
#include "harfbuzz/src/hb-shape.cc"
#include "harfbuzz/src/hb-shaper.cc"
#include "harfbuzz/src/hb-static.cc"
#include "harfbuzz/src/hb-style.cc"
#include "harfbuzz/src/hb-subset-cff-common.cc"
#include "harfbuzz/src/hb-subset-cff1.cc"
#include "harfbuzz/src/hb-subset-cff2.cc"
#include "harfbuzz/src/hb-subset-input.cc"
#include "harfbuzz/src/hb-subset-instancer-solver.cc"
#include "harfbuzz/src/hb-subset-plan.cc"
#include "harfbuzz/src/hb-subset-repacker.cc"
#include "harfbuzz/src/hb-subset.cc"
#include "harfbuzz/src/hb-ucd.cc"
#include "harfbuzz/src/hb-unicode.cc"

HB_BEGIN_DECLS

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size);

hb_set_t *
hb_subset_input_no_subset_set (hb_subset_input_t *input);

void *free_ptr(void);

HB_END_DECLS


void *free_ptr(void) { return (void *) free; }

enum {
  HB_SHAPE_DONT_STOP,
  HB_SHAPE_GSUB_PHASE,
  HB_SHAPE_GPOS_PHASE
};

struct user_data_t {
  user_data_t(char *str_,
              unsigned size_,
              unsigned stop_at_ = 0,
              unsigned stop_phase_ = 0)
    : str(str_)
    , size(size_)
    , stop_at(stop_at_)
    , stop_phase(stop_phase_)
  {}
  char *str = nullptr;
  unsigned size = 0;
  unsigned consumed = 0;
  hb_bool_t failure = false;
  unsigned stop_at = 0;
  unsigned stop_phase = 0;
  hb_bool_t stopping = false;
  unsigned current_phase = 0;
};


static void
_user_data_printf (user_data_t *data, const char *format, ...)
{
#define BUFSIZE 1000
  char buf[BUFSIZE];
  int len;
  va_list va;

  if (!data || data->failure)
    return;

  va_start(va, format);
  len = vsnprintf(buf, BUFSIZE, format, va);
  va_end(va);

  if (data->consumed + len >= data->size || len < 0 || len > BUFSIZE)
  {
      data->failure = true;
      return;
  }

  memcpy (data->str + data->consumed, buf, len);
  data->consumed += len;
#undef BUFSIZE
}

static void
move_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  _user_data_printf (draw_data, "M%g,%g", (double)to_x, (double)to_y);
}

static void
line_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  _user_data_printf (draw_data, "L%g,%g", (double)to_x, (double)to_y);
}

static void
quadratic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	      float control_x, float control_y,
	      float to_x, float to_y,
	      void *)
{
  _user_data_printf (draw_data, "Q%g,%g %g,%g",
                     (double)control_x,
                     (double)control_y,
                     (double)to_x,
                     (double)to_y);
}

static void
cubic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	  float control1_x, float control1_y,
	  float control2_x, float control2_y,
	  float to_x, float to_y,
	  void *)
{
  _user_data_printf (draw_data, "C%g,%g %g,%g %g,%g",
                     (double)control1_x,
                     (double)control1_y,
                     (double)control2_x,
                     (double)control2_y,
                     (double)to_x,
                     (double)to_y);
}

static void
close_path (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *, void *)
{
  _user_data_printf (draw_data, "Z");
}

static hb_draw_funcs_t *funcs = 0;

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size)
{
  if (funcs == 0) /* not the best pattern for multi-threaded apps which is not a concern here */
  {
    funcs = hb_draw_funcs_create (); /* will be leaked */
    hb_draw_funcs_set_move_to_func (funcs, (hb_draw_move_to_func_t) move_to, nullptr, nullptr);
    hb_draw_funcs_set_line_to_func (funcs, (hb_draw_line_to_func_t) line_to, nullptr, nullptr);
    hb_draw_funcs_set_quadratic_to_func (funcs, (hb_draw_quadratic_to_func_t) quadratic_to, nullptr, nullptr);
    hb_draw_funcs_set_cubic_to_func (funcs, (hb_draw_cubic_to_func_t) cubic_to, nullptr, nullptr);
    hb_draw_funcs_set_close_path_func (funcs, (hb_draw_close_path_func_t) close_path, nullptr, nullptr);
  }

  user_data_t draw_data(buf, buf_size);
  hb_font_get_glyph_shape (font, glyph, funcs, &draw_data);
  if (draw_data.failure)
    return -1;

  buf[draw_data.consumed] = '\0';
  return draw_data.consumed;
}

hb_set_t *
hb_subset_input_no_subset_set (hb_subset_input_t *input)
{
  return input->sets.no_subset_tables;
}
