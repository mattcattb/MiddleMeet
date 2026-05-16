package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(client *redis.Client) *RedisCache {
	return &RedisCache{client}
}

func (c *RedisCache) Get(ctx context.Context, key string, out any) (bool, error) {
	val, err := c.client.Get(ctx, key).Result()

	if err == redis.Nil {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	if err := json.Unmarshal([]byte(val), out); err != nil {
		return false, err
	}

	return true, nil
}
func (c *RedisCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {

	jByes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	err = c.client.Set(ctx, key, jByes, ttl).Err()

	return err
}
