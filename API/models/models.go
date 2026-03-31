package models

import (
	"fmt"
	"log"

	"github.com/gobuffalo/envy"
	"github.com/gobuffalo/pop/v6"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// DB is the Pop connection used for buffalo migrations.
var DB *pop.Connection

// SQL is the raw sqlx connection used by all handlers.
var SQL *sqlx.DB

func init() {
	env := envy.Get("GO_ENV", "development")

	// Pop connection — used by `buffalo db` migration commands
	var err error
	DB, err = pop.Connect(env)
	if err != nil {
		log.Fatal("Pop DB connect failed:", err)
	}
	pop.Debug = env == "development"

	// Direct sqlx connection — used by all HTTP handlers
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		envy.Get("DB_USER", "postgres"),
		envy.Get("DB_PASSWORD", "postgres"),
		envy.Get("DB_HOST", "localhost"),
		envy.Get("DB_PORT", "5432"),
		envy.Get("DB_NAME", "game"),
	)
	SQL, err = sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatal("sqlx DB connect failed:", err)
	}
	SQL.SetMaxOpenConns(20)
	SQL.SetMaxIdleConns(5)
}
