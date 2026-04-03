package actions

import (
	"sync"

	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/envy"
	forcessl "github.com/gobuffalo/mw-forcessl"
	paramlogger "github.com/gobuffalo/mw-paramlogger"
	"github.com/rs/cors"
	"github.com/unrolled/secure"
)

// ENV is the running environment. Default: "development".
var ENV = envy.Get("GO_ENV", "development")

var (
	app     *buffalo.App
	appOnce sync.Once
)

// App builds and returns the Buffalo application (singleton).
func App() *buffalo.App {
	appOnce.Do(func() {
		app = buffalo.New(buffalo.Options{
			Env:         ENV,
			SessionName: "_qiz_session",
		})

		// SSL redirect (only in production)
		app.Use(forceSSL())

		// Parameter logging
		app.Use(paramlogger.ParameterLogger)

		// CORS
		corsOpts := cors.Options{
			AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
			ExposedHeaders:   []string{"Content-Length"},
			AllowCredentials: true,
		}
		if ENV == "development" {
			// Allow any localhost/127.0.0.1 origin so Swagger UI and the Next.js
			// dev server can both call the API without CORS errors.
			corsOpts.AllowOriginFunc = func(origin string) bool {
				return strings.HasPrefix(origin, "http://localhost") ||
					strings.HasPrefix(origin, "http://127.0.0.1:3001") ||
					strings.HasPrefix(origin, "http://localhost:3001") ||
					strings.HasPrefix(origin, "localhost:3001")
			}
		} else {
			corsOpts.AllowedOrigins = []string{envy.Get("CORS_ORIGINS", "http://localhost:3000")}
		}
		corsHandler := cors.New(corsOpts)
		app.Use(func(next buffalo.Handler) buffalo.Handler {
			return func(c buffalo.Context) error {
				corsHandler.HandlerFunc(c.Response(), c.Request())
				// Short-circuit preflight requests — CORS handler already wrote the response
				if c.Request().Method == http.MethodOptions {
					return nil
				}
				return next(c)
			}
		})

		// Catch-all OPTIONS route so CORS middleware runs for every preflight
		app.OPTIONS("/{path:.*}", func(c buffalo.Context) error { return nil })

		// Health check
		app.GET("/", HomeHandler)

		// /api
		api := app.Group("/api")

		// Swagger JSON spec
		api.GET("/swagger.json", SwaggerJSONHandler)

		// Swagger UI — development only
		if ENV == "development" {
			api.GET("/swagger", SwaggerUIHandler)
		}
		rooms := api.Group("/rooms")
		rooms.GET("/", RoomsListHandler)
		rooms.POST("/", RoomsCreateHandler)

		room := api.Group("/rooms/{room_id}")
		room.GET("/", RoomsShowHandler)
		room.PATCH("/", RoomsPatchHandler)

		// Players under a room
		room.GET("/players", PlayersListHandler)
		room.POST("/players", PlayersCreateHandler)
		room.GET("/players/{player_id}", PlayersShowHandler)
		room.PATCH("/players/{player_id}", PlayersPatchHandler)
		room.DELETE("/players/{player_id}", PlayersDeleteHandler)

		// Games under a room
		room.GET("/games", GamesListHandler)
		room.POST("/games", GamesCreateHandler)
		room.GET("/games/{game_id}", GamesShowHandler)
		room.PATCH("/games/{game_id}", GamesPatchHandler)
		room.DELETE("/games/{game_id}", GamesDeleteHandler)

		// Game results
		room.GET("/games/{game_id}/results", ResultsListHandler)
		room.POST("/games/{game_id}/results", ResultsCreateHandler)
		room.PUT("/games/{game_id}/results", ResultsBatchHandler)

		// Random game
		room.POST("/games/{game_id}/random/winners", RandomWinnerCreateHandler)
		room.GET("/games/{game_id}/random/winners", RandomWinnersListHandler)

		// WebSocket endpoint
		app.GET("/ws", WebSocketHandler)
	})

	return app
}

// forceSSL middleware  redirects to HTTPS in production only.
func forceSSL() buffalo.MiddlewareFunc {
	return forcessl.Middleware(secure.Options{
		SSLRedirect:     ENV == "production",
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}
