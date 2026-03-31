package grifts

import (
	"github.com/gobuffalo/grift/grift"
)

var _ = grift.Namespace("db", func() {
	grift.Desc("seed", "Seeds the database with initial data")
	var _ = grift.Add("seed", func(c *grift.Context) error {
		// Add seed data here
		return nil
	})
})
