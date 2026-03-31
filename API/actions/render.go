package actions

import (
	"github.com/gobuffalo/buffalo/render"
)

var r *render.Engine

func init() {
	r = render.New(render.Options{
		// DefaultContentType sets the Content-Type header if not set by the handler.
		DefaultContentType: "application/json",
	})
}
