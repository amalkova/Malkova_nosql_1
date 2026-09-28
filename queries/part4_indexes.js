db = db.getSiblingDB("spotify");

// =====================================================
// Завдання 1. Аналіз запиту та індексація
// =====================================================

print("\n=== Завдання 1. BEFORE INDEX ===");

// Видаляємо наш індекс, якщо скрипт запускається повторно
try {
  db.tracks.dropIndex("idx_genre_popularity_danceability");
} catch (e) {
  // Індекс ще не існує — це нормально
}

const query1 = {
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
};

const sort1 = {
  popularity: -1
};

printjson(
  db.tracks
    .find(query1)
    .sort(sort1)
    .explain("executionStats")
);


// Створюємо складений індекс:
// 1) equality: track_genre
// 2) sort: popularity
// 3) range: danceability

print("\n=== Creating index ===");

db.tracks.createIndex(
  {
    track_genre: 1,
    popularity: -1,
    "audio_features.danceability": 1
  },
  {
    name: "idx_genre_popularity_danceability"
  }
);


print("\n=== Завдання 1. AFTER INDEX ===");

printjson(
  db.tracks
    .find(query1)
    .sort(sort1)
    .explain("executionStats")
);


// =====================================================
// Завдання 2. Індекс для музики для роботи
// =====================================================

print("\n=== Завдання 2. Work music index ===");

db.tracks.createIndex(
  {
    explicit: 1,
    "audio_features.instrumentalness": 1,
    "audio_features.speechiness": 1
  },
  {
    name: "idx_work_music"
  }
);

const workMusicQuery = {
  explicit: false,
  "audio_features.instrumentalness": { $gt: 0.5 },
  "audio_features.speechiness": { $lt: 0.1 }
};

printjson(
  db.tracks
    .find(workMusicQuery)
    .explain("executionStats")
);


// =====================================================
// Завдання 3. Покривний запит
//
// Запит:
// db.tracks.find({
//   track_genre: "pop",
//   popularity: { $gte: 70 }
// });
//
// Висновок буде описаний у README.
// =====================================================

print("\n=== Завдання 3. Covered query check ===");

printjson(
  db.tracks.find({
    track_genre: "pop",
    popularity: { $gte: 70 }
  }).explain("executionStats")
);
