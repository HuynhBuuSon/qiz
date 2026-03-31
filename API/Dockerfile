FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Install Buffalo CLI
RUN go install github.com/gobuffalo/cli/cmd/buffalo@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the binary
RUN buffalo build --static -o /app/bin/qiz-api

# ---

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/bin/qiz-api .
COPY --from=builder /app/database.yml .
COPY --from=builder /app/migrations ./migrations

EXPOSE 3001

CMD ["/app/qiz-api"]
