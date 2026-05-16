package location

import (
	"fmt"
	"middle-meetup-server/internal/geo"
	"strings"
)

type Finder interface {
	GeocodeSearch(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error)
	GeocodeAutocomplete(query string, near geo.Coord) ([]geo.Location, error)
	ReverseGeocode(coord geo.Coord) (geo.Location, error)
}

type Service struct {
	finder Finder
}

func NewService(finder Finder) *Service {
	return &Service{finder: finder}
}

func (s *Service) GeocodeSearch(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	if radiusMeters <= 0 {
		radiusMeters = 10000
	}

	return s.finder.GeocodeSearch(query, near, radiusMeters)
}

func (s *Service) GeocodeAutocomplete(query string, near geo.Coord) ([]geo.Location, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("autocomplete query is required")
	}

	return s.finder.GeocodeAutocomplete(query, near)
}

func (s *Service) ReverseGeocode(coord geo.Coord) (geo.Location, error) {
	return s.finder.ReverseGeocode(coord)
}
