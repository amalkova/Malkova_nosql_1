db = db.getSiblingDB("spotify");

// =====================================================
// Завдання 1. Треки для вечірки
// danceability > 0.7, energy > 0.7,
// тривалість 180000–300000 мс
// =====================================================

print("\n=== Завдання 1. Треки для вечірки ===");

db.tracks.find(
  {
    "audio_features.danceability": { $gt: 0.7 },
    "audio_features.energy": { $gt: 0.7 },
    duration_ms: { $gte: 180000, $lte: 300000 }
  },
  {
    _id: 0,
    track_name: 1,
    artists: 1,
    duration_ms: 1,
    "audio_features.danceability": 1,
    "audio_features.energy": 1
  }
).limit(20).forEach(printjson);


// =====================================================
// Завдання 2. Виконавці, у яких усі треки популярні
// мінімум 3 треки, мінімальна popularity >= 60
// =====================================================

print("\n=== Завдання 2. Популярні виконавці ===");

db.tracks.aggregate([
  {
    $unwind: "$artists"
  },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      track_count: { $gte: 3 },
      min_popularity: { $gte: 60 }
    }
  },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      track_count: 1,
      min_popularity: 1,
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  },
  {
    $sort: {
      avg_popularity: -1
    }
  },
  {
    $limit: 20
  }
]).forEach(printjson);


// =====================================================
// Завдання 3. Нетипові треки
// tempo > avg tempo жанру + 2 * stdDevPop
// =====================================================

print("\n=== Завдання 3. Нетипові треки ===");

db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      stddev_tempo: { $stdDevPop: "$audio_features.tempo" },

      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: {
            tempo: "$audio_features.tempo"
          }
        }
      }
    }
  },

  {
    $set: {
      outlier_threshold: {
        $add: [
          "$avg_tempo",
          { $multiply: [2, "$stddev_tempo"] }
        ]
      }
    }
  },

  {
    $set: {
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "track",
          cond: {
            $gt: [
              "$$track.audio_features.tempo",
              "$outlier_threshold"
            ]
          }
        }
      }
    }
  },

  {
    $match: {
      "outlier_tracks.0": { $exists: true }
    }
  },

  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: { $round: ["$avg_tempo", 1] },
      outlier_threshold: { $round: ["$outlier_threshold", 1] },
      outlier_tracks: 1
    }
  },

  {
    $sort: {
      genre: 1
    }
  }
]).forEach(printjson);


// =====================================================
// Завдання 4. Треки для фонової роботи
// loudness < -10
// speechiness < 0.1
// instrumentalness > 0.5
// explicit = false
// =====================================================

print("\n=== Завдання 4. Треки для фонової роботи ===");

db.tracks.find(
  {
    "audio_features.loudness": { $lt: -10 },
    "audio_features.speechiness": { $lt: 0.1 },
    "audio_features.instrumentalness": { $gt: 0.5 },
    explicit: false
  },
  {
    _id: 0,
    track_name: 1,
    artists: 1,
    explicit: 1,
    "audio_features.loudness": 1,
    "audio_features.speechiness": 1,
    "audio_features.instrumentalness": 1
  }
).limit(20).forEach(printjson);
