/**
 * Regression Test Suite
 * Tests for historical APIs and snapshot testing for S3/CDN functionality
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Mock AWS SDK for consistent testing
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-cloudfront');

describe('Regression Test Suite', () => {
  let app;

  beforeAll(async () => {
    // Setup test database connection
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(() => {
    // Setup app with mocked services
    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
  });

  describe('Historical API Compatibility', () => {
    describe('Albums API Regression', () => {
      test('GET /api/main/albums should return CDN URLs instead of legacy paths', async () => {
        const response = await request(app)
          .get('/api/main/albums')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('albums');

        if (response.body.albums && response.body.albums.length > 0) {
          response.body.albums.forEach(album => {
            // Should not contain legacy filesystem paths
            if (album.img && album.img.url) {
              expect(album.img.url).not.toMatch(/^\/uploads\//);
              expect(album.img.url).not.toMatch(/^uploads\//);
            }

            // Should contain CDN URLs when available
            if (album.img && album.img.cdnUrl) {
              expect(album.img.cdnUrl).toMatch(/^https:\/\//);
              expect(album.img.cdnUrl).toContain('cloudfront');
            }
          });
        }

        // Snapshot test for API response structure
        expect(response.body).toMatchSnapshot({
          albums: expect.any(Array),
          timestamp: expect.any(String)
        });
      });

      test('POST /api/main/albums should create album with CDN URLs', async () => {
        const testImage = Buffer.from('fake-album-cover');
        
        const response = await request(app)
          .post('/api/main/albums')
          .field('name', 'Regression Test Album')
          .field('description', 'Album for regression testing')
          .attach('img', testImage, 'regression-album.jpg')
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('album');
        
        const album = response.body.album;
        expect(album).toHaveProperty('name', 'Regression Test Album');
        
        if (album.img) {
          expect(album.img).toHaveProperty('cdnUrl');
          expect(album.img.cdnUrl).toMatch(/^https:\/\//);
          expect(album.img).toHaveProperty('s3Key');
          expect(album.img.s3Key).toMatch(/^uploads\//);
        }

        // Snapshot test for album creation response
        expect(response.body).toMatchSnapshot({
          album: {
            _id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            img: {
              _id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              s3Key: expect.any(String),
              cdnUrl: expect.any(String)
            }
          }
        });
      });
    });

    describe('Songs API Regression', () => {
      test('GET /api/main/songs should return songs with CDN URLs', async () => {
        const response = await request(app)
          .get('/api/main/songs')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('songs');

        if (response.body.songs && response.body.songs.length > 0) {
          response.body.songs.forEach(song => {
            // Check image CDN URL
            if (song.img && song.img.cdnUrl) {
              expect(song.img.cdnUrl).toMatch(/^https:\/\//);
              expect(song.img.cdnUrl).toContain('cloudfront');
            }

            // Check audio file CDN URL
            if (song.audioFile && song.audioFile.cdnUrl) {
              expect(song.audioFile.cdnUrl).toMatch(/^https:\/\//);
              expect(song.audioFile.cdnUrl).toContain('cloudfront');
            }

            // Should not contain legacy paths
            if (song.img && song.img.url) {
              expect(song.img.url).not.toMatch(/^\/uploads\//);
            }
          });
        }

        // Snapshot test
        expect(response.body).toMatchSnapshot({
          songs: expect.any(Array),
          timestamp: expect.any(String)
        });
      });
    });

    describe('Videos API Regression', () => {
      test('GET /api/main/videos should return videos with CDN URLs', async () => {
        const response = await request(app)
          .get('/api/main/videos')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('videos');

        if (response.body.videos && response.body.videos.length > 0) {
          response.body.videos.forEach(video => {
            // Check thumbnail CDN URL
            if (video.img && video.img.cdnUrl) {
              expect(video.img.cdnUrl).toMatch(/^https:\/\//);
              expect(video.img.cdnUrl).toContain('cloudfront');
            }

            // Should not contain legacy paths
            if (video.img && video.img.url) {
              expect(video.img.url).not.toMatch(/^\/uploads\//);
            }
          });
        }

        // Snapshot test
        expect(response.body).toMatchSnapshot({
          videos: expect.any(Array),
          timestamp: expect.any(String)
        });
      });
    });

    describe('Articles API Regression', () => {
      test('GET /api/article should return articles with CDN URLs', async () => {
        const response = await request(app)
          .get('/api/article')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('articles');

        if (response.body.articles && response.body.articles.length > 0) {
          response.body.articles.forEach(article => {
            // Check article image CDN URLs
            if (article.img && article.img.cdnUrl) {
              expect(article.img.cdnUrl).toMatch(/^https:\/\//);
              expect(article.img.cdnUrl).toContain('cloudfront');
            }

            // Check embedded images in content
            if (article.content) {
              // Should not contain legacy image references
              expect(article.content).not.toMatch(/src=["']\/uploads\//g);
              expect(article.content).not.toMatch(/src=["']uploads\//g);
            }
          });
        }

        // Snapshot test
        expect(response.body).toMatchSnapshot({
          articles: expect.any(Array),
          timestamp: expect.any(String)
        });
      });
    });

    describe('Files API Regression', () => {
      test('GET /api/main/files should return files with CDN URLs', async () => {
        const response = await request(app)
          .get('/api/main/files')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('files');

        if (response.body.files && response.body.files.length > 0) {
          response.body.files.forEach(file => {
            // All files should have CDN URLs
            if (file.cdnUrl) {
              expect(file.cdnUrl).toMatch(/^https:\/\//);
              expect(file.cdnUrl).toContain('cloudfront');
            }

            // Should have S3 keys
            if (file.s3Key) {
              expect(file.s3Key).toMatch(/^uploads\//);
            }

            // Legacy URL should not be the primary access path
            if (file.url) {
              expect(file.url).not.toMatch(/^\/uploads\//);
            }
          });
        }

        // Snapshot test
        expect(response.body).toMatchSnapshot({
          files: expect.any(Array),
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Backwards Compatibility Tests', () => {
    test('should handle requests expecting legacy URL format', async () => {
      // Test that old clients expecting specific URL formats still work
      const response = await request(app)
        .get('/api/main/albums')
        .set('Accept', 'application/json')
        .set('User-Agent', 'LegacyClient/1.0')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('albums');

      // Should still work but return modern format
      if (response.body.albums && response.body.albums.length > 0) {
        const firstAlbum = response.body.albums[0];
        if (firstAlbum.img) {
          // Should provide both legacy and modern access
          expect(firstAlbum.img).toHaveProperty('cdnUrl');
        }
      }
    });

    test('should maintain API response timing characteristics', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/main/albums')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should maintain good performance with S3/CDN
      expect(responseTime).toBeLessThan(2000); // 2 seconds max
    });
  });

  describe('S3/CDN State Consistency', () => {
    test('should never return mixed legacy/CDN URLs in same response', async () => {
      const endpoints = [
        '/api/main/albums',
        '/api/main/songs',
        '/api/main/videos',
        '/api/main/files'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        if (response.body.albums || response.body.songs || response.body.videos || response.body.files) {
          const items = response.body.albums || response.body.songs || response.body.videos || response.body.files;
          
          if (items && items.length > 0) {
            const urlTypes = items.map(item => {
              if (item.img && item.img.url) {
                return item.img.url.startsWith('http') ? 'cdn' : 'legacy';
              }
              return 'none';
            }).filter(type => type !== 'none');

            // All URLs should be of the same type (preferably CDN)
            const uniqueTypes = [...new Set(urlTypes)];
            expect(uniqueTypes.length).toBeLessThanOrEqual(1);
            
            if (uniqueTypes.length === 1) {
              expect(uniqueTypes[0]).toBe('cdn');
            }
          }
        }
      }
    });

    test('should maintain referential integrity between collections', async () => {
      // Get albums with images
      const albumsResponse = await request(app)
        .get('/api/main/albums')
        .expect(200);

      if (albumsResponse.body.albums && albumsResponse.body.albums.length > 0) {
        for (const album of albumsResponse.body.albums) {
          if (album.img && album.img._id) {
            // Check that the referenced file exists
            const fileResponse = await request(app)
              .get(`/api/main/files/${album.img._id}`)
              .expect(200);

            expect(fileResponse.body).toHaveProperty('success', true);
            expect(fileResponse.body.file).toHaveProperty('_id', album.img._id);
            
            // CDN URLs should match
            if (album.img.cdnUrl && fileResponse.body.file.cdnUrl) {
              expect(album.img.cdnUrl).toBe(fileResponse.body.file.cdnUrl);
            }
          }
        }
      }
    });
  });

  describe('Performance Regression Tests', () => {
    test('should load album list within acceptable time', async () => {
      const measurements = [];
      
      // Take multiple measurements
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint();
        
        await request(app)
          .get('/api/main/albums')
          .expect(200);
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
        measurements.push(responseTime);
      }

      const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);

      // Performance expectations
      expect(averageTime).toBeLessThan(500); // 500ms average
      expect(maxTime).toBeLessThan(1000);    // 1s maximum
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/main/files')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });
  });

  describe('Error Handling Regression', () => {
    test('should maintain consistent error response format', async () => {
      // Test 404 error
      const notFoundResponse = await request(app)
        .get('/api/main/albums/507f1f77bcf86cd799439011') // Invalid ObjectId
        .expect(404);

      expect(notFoundResponse.body).toHaveProperty('success', false);
      expect(notFoundResponse.body).toHaveProperty('error');
      expect(typeof notFoundResponse.body.error).toBe('string');

      // Snapshot test for error format
      expect(notFoundResponse.body).toMatchSnapshot({
        error: expect.any(String),
        timestamp: expect.any(String)
      });
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/main/albums')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });


});