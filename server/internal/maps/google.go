package maps

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/meeting"
	"net/http"
)

type GoogleClient struct {
	apiKey     string
	httpClient *http.Client
}

func (c *GoogleClient) EstimateRoute(from geo.Location, to geo.Location) (meeting.RouteEstimate, error) {
	return meeting.RouteEstimate{}, fmt.Errorf("google maps route estimates are not implemented")
}

func (c *GoogleClient) SearchLocations(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return nil, fmt.Errorf("google maps location search is not implemented")
}

func (c *GoogleClient) BuildIsochrone(origin geo.Location, maxDurationSeconds int) (geo.Polygon, error) {
	return geo.Polygon{}, fmt.Errorf("google maps isochrone search is not implemented")
}

func (c *GoogleClient) SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return nil, fmt.Errorf("google maps places search is not implemented")
}
