package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// RawJSON is a []byte wrapper that correctly handles PostgreSQL JSONB:
// - sql.Scanner: reads raw bytes from the DB column
// - json.Marshaler: writes the bytes verbatim into a JSON response (not base64)
// - json.Unmarshaler: reads a JSON value (e.g. from a request body) into bytes
type RawJSON []byte

func (r *RawJSON) Scan(src any) error {
	switch v := src.(type) {
	case []byte:
		cp := make([]byte, len(v))
		copy(cp, v)
		*r = cp
		return nil
	case string:
		*r = []byte(v)
		return nil
	case nil:
		*r = []byte(`{}`)
		return nil
	}
	return fmt.Errorf("RawJSON: unsupported source type %T", src)
}

func (r RawJSON) Value() (driver.Value, error) {
	if len(r) == 0 {
		return `{}`, nil
	}
	return string(r), nil
}

func (r RawJSON) MarshalJSON() ([]byte, error) {
	if len(r) == 0 {
		return []byte(`{}`), nil
	}
	return json.RawMessage(r).MarshalJSON()
}

func (r *RawJSON) UnmarshalJSON(data []byte) error {
	*r = RawJSON(data)
	return nil
}
