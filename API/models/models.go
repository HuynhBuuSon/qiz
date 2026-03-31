package models

import (
	"log"

	"github.com/gobuffalo/envy"
	"github.com/gobuffalo/pop/v6"
)

// DB is a connection to the database that needs to be used in
// every request that is using the Pop ORM.
var DB *pop.Connection

func init() {
	var err error
	env := envy.Get("GO_ENV", "development")
	DB, err = pop.Connect(env)
	if err != nil {
		log.Fatal(err)
	}
	pop.Debug = env == "development"
}
