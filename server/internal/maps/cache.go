package maps

import (
	"context"
	"fmt"
	"middle-meetup-server/internal/cache"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/location"
	"middle-meetup-server/internal/meeting"
	"time"
)

type Client interface {
	location.Finder
	meeting.RouteEstimator
	meeting.AreaEstimator
	meeting.PlaceFinder
}

type CachedClient struct {
	next  Client
	cache *cache.RedisCache
}

func NewCachedClient(next Client, cache *cache.RedisCache) *CachedClient {
	return &CachedClient{
		next:  next,
		cache: cache,
	}
}

func (c *CachedClient) GeocodeAutocomplete(query string, near geo.Coord) (results []geo.Location, err error) {

	key := fmt.Sprintf("cache:map:geocode:autocomplete:%s:near:%.6f:%.6f", query, near.Lat, near.Lng)
	ctx := context.Background()
	ok, err := c.cache.Get(ctx, key, &results)

	if ok {
		return results, nil
	}

	res, err := c.next.GeocodeAutocomplete(query, near)

	if err != nil {
		return results, err
	}

	_ = c.cache.Set(ctx, key, res, time.Hour*5)

	return res, nil
}

func (c *CachedClient) GeocodeSearch(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {

	ctx := context.Background()
	key := fmt.Sprintf("cache:map:geocode:search:%s:%.6f:%.6f:radius:%d", query, near.Lat, near.Lng, radiusMeters)
	var cached []geo.Location

	ok, err := c.cache.Get(ctx, key, &cached)

	if err == nil && ok {
		return cached, nil
	}

	res, err := c.next.GeocodeSearch(query, near, radiusMeters)

	if err != nil {
		return nil, err
	}

	go func() {
		// seperate go thread do this
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()

		_ = c.cache.Set(ctx, key, res, 24*time.Hour)
	}()

	return res, nil
}

func (c *CachedClient) ReverseGeocode(coord geo.Coord) (geo.Location, error) {
	key := fmt.Sprintf("cache:map:geocode:reverse:%.6f:%.6f", coord.Lat, coord.Lng)

	var cached geo.Location

	ctx := context.Background()

	ok, err := c.cache.Get(ctx, key, &cached)

	if err == nil && ok {
		return cached, nil
	}

	res, err := c.next.ReverseGeocode(coord)

	if err != nil {
		return geo.Location{}, err
	}

	_ = c.cache.Set(ctx, key, res, 24*time.Hour)

	return res, nil
}

func (c *CachedClient) EstimateRoute(from geo.Location, to geo.Location) (meeting.RouteEstimate, error) {

	key := fmt.Sprintf("cache:estimate:route:from:%.6f:%.6f:to:%.6f:%.6f", from.Coord.Lat, from.Coord.Lng, to.Coord.Lat, to.Coord.Lng)

	ctx := context.Background()
	var cached meeting.RouteEstimate

	ok, err := c.cache.Get(ctx, key, &cached)

	if err == nil && ok {
		return cached, nil
	}

	res, err := c.next.EstimateRoute(from, to)

	_ = c.cache.Set(ctx, key, res, 24*time.Hour)

	return res, nil

}

func (c *CachedClient) EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (meeting.RouteMatrix, error) {
	return c.next.EstimateRouteMatrix(origins, destinations)
}

func (c *CachedClient) BuildIsochrone(origin geo.Location, maxDurationSeconds int) (geo.Polygon, error) {
	return c.next.BuildIsochrone(origin, maxDurationSeconds)
}

func (c *CachedClient) SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return c.next.SearchPlaces(query, near, radiusMeters)
}
