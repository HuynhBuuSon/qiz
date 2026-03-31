package main

import (
	"log"

	"github.com/canhan/qiz-api/actions"
)

func main() {
	app := actions.App()
	if err := app.Serve(); err != nil {
		log.Fatal(err)
	}
}
