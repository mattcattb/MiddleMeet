package maps

import (
	"middle-meetup-server/internal/cache"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/location"
	"middle-meetup-server/internal/meeting"
)

type Client interface {
	location.Finder
	meeting.RouteEstimator
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

func (c *CachedClient) GeocodeAutocomplete(query string, near geo.Coord) ([]geo.Location, error) {
	return c.next.GeocodeAutocomplete(query, near)
}

func (c *CachedClient) GeocodeSearch(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return c.next.GeocodeSearch(query, near, radiusMeters)
}

func (c *CachedClient) ReverseGeocode(coord geo.Coord) (geo.Location, error) {
	return c.next.ReverseGeocode(coord)
}

func (c *CachedClient) EstimateRoute(from geo.Location, to geo.Location) (meeting.RouteEstimate, error) {
	return c.next.EstimateRoute(from, to)
}

func (c *CachedClient) EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (meeting.RouteMatrix, error) {
	return c.next.EstimateRouteMatrix(origins, destinations)
}
