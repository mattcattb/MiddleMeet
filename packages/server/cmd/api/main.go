package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"map-go-server/internal/httpapi"
	"map-go-server/internal/maps"
	"map-go-server/internal/meeting"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	openRouteApiKey := os.Getenv("OPENROUTE_API_KEY")

	if openRouteApiKey == "" {
		fmt.Println("OPENROUTE_API_KEY is not set")
		return
	}

	config := httpapi.Config{Port: port, OpenRouteAPIKey: openRouteApiKey}

	openrouteClient := maps.NewClient(openRouteApiKey)

	meeting := meeting.NewService(openrouteClient)

	application := httpapi.NewServer(httpapi.Application{Config: config, MeetingService: *meeting})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      application,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	slog.Info("starting Go API", "addr", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
