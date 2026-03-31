package actions

import "github.com/gobuffalo/buffalo"

// HomeHandler is a default handler to serve up a welcome page.
func HomeHandler(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]string{
		"message": "Welcome to the Qiz API",
		"version": "1.0.0",
		"status":  "ok",
	}))
}
