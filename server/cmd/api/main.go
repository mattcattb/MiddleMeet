package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"middle-meetup-server/internal/cache"
	"middle-meetup-server/internal/httpapi"
	"middle-meetup-server/internal/location"
	"middle-meetup-server/internal/maps"
	"middle-meetup-server/internal/maps/openroute"
	"middle-meetup-server/internal/meeting"

	"github.com/redis/go-redis/v9"
)

const defaultRedisURL = "redis://localhost:16379/0"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	openRouteApiKey := os.Getenv("OPENROUTE_API_KEY")
	redisUrl := os.Getenv("REDIS_URL")

	if redisUrl == "" {
		redisUrl = defaultRedisURL
	}

	if openRouteApiKey == "" {
		fmt.Println("OPENROUTE_API_KEY is not set")
		return
	}

	config := httpapi.Config{
		Port:            port,
		OpenRouteAPIKey: openRouteApiKey,
		CORSOrigins:     splitEnvList(os.Getenv("CORS_ORIGINS")),
	}

	opt, err := redis.ParseURL(redisUrl)

	if err != nil {
		fmt.Println("Error occured parsing REDIS_URL, %w", err)
		return
	}
	redisClient := redis.NewClient(opt)
	cache := cache.NewRedisCache(redisClient)

	openrouteClient := openroute.NewClient(openRouteApiKey)
	mapsCacheClient := maps.NewCachedClient(openrouteClient, cache)

	meetingPlanner := meeting.NewPlanner(mapsCacheClient, mapsCacheClient, mapsCacheClient)
	locationService := location.NewService(mapsCacheClient)

	application := httpapi.NewServer(httpapi.Application{
		Config:         config,
		MeetingPlanner: meetingPlanner,
		Locations:      locationService,
	})

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

func splitEnvList(value string) []string {
	parts := strings.Split(value, ",")
	values := make([]string, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			values = append(values, part)
		}
	}

	return values
}
