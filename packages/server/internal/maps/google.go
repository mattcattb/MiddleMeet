package maps

import (
	"fmt"
	"map-go-server/internal/geo"
	"map-go-server/internal/meeting"
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
