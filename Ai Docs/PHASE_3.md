# ThoraxVision — Phase 3: AI Inference Engine

**Status:** ✅ Selesai & tervalidasi dengan bobot model asli
**Lingkup:** Engine AI reusable (`app/ai/`). Tanpa endpoint API, upload route, database, auth, maupun Docker.

---

## 1. Tujuan

Membangun **AI Engine mandiri** yang menerima `PIL.Image` dan mengembalikan hasil klasifikasi TB, siap dipanggil oleh service layer FastAPI di fase berikutnya. Engine ini tidak mengetahui apa pun tentang HTTP, database, atau filesystem.

---

## 2. Modul yang Dibuat

```
backend/app/ai/
├── builder.py        # Rekonstruksi arsitektur DenseNet121 + custom head
├── loader.py         # Singleton thread-safe: model + bobot + 3 JSON config
├── preprocessor.py   # Transform val/test dari transforms.json
├── predictor.py      # InferenceEngine: PIL.Image → PredictionResult
├── gradcam.py        # Grad-CAM (denseblock4) → overlay PIL.Image
├── schemas.py        # Dataclass PredictionResult
├── exceptions.py     # Error bertipe
└── README.md         # Panduan pemakaian engine

backend/ml_models/
├── densenet121_tb_v1.pth   # Bobot (git-ignored)
├── metadata.json           # Arsitektur head, threshold, versi, metrik
├── labels.json             # {0: NON_TBC, 1: TUBERKULOSIS}
└── transforms.json         # Langkah preprocessing inference
```

| Modul | Tanggung jawab |
|-------|----------------|
| `builder.py` | `build_model()` membangun DenseNet121 (`weights=None`) dan mengganti classifier default dengan custom head hasil optimasi GWO. Parameter `dropout_rate` & `dense_units` dibaca dari `metadata.json`. |
| `loader.py` | `ModelLoader` — singleton dengan *double-checked locking*. Memuat arsitektur, `state_dict` (`map_location`, `weights_only=True`), dan tiga JSON **satu kali**, lalu `model.eval()`. Menyediakan `reset()` untuk ganti versi model. |
| `preprocessor.py` | Membangun `transforms.Compose` **dari `transforms.json`** (bukan hardcode). Menjamin `.convert("RGB")` dan menyediakan array base untuk overlay Grad-CAM. |
| `predictor.py` | `InferenceEngine.predict()` — preprocessing → forward pass dalam `torch.no_grad()` → softmax → keputusan threshold/argmax. Logging di setiap tahap. |
| `gradcam.py` | `GradCAMEngine` atas `model.features.denseblock4`, dijalankan **di luar** `no_grad`, mengembalikan overlay sebagai `PIL.Image` (belum menulis file). |
| `schemas.py` | `PredictionResult`: `prediction`, `class_id`, `confidence`, `probabilities`, `inference_time`, `tb_probability`, `used_threshold`. |
| `exceptions.py` | `ModelFileNotFoundError`, `MetadataNotFoundError`, `ModelLoadError`, `InvalidImageError`, `InferenceError` — semuanya turunan `AIEngineError`. |

---

## 3. Rekonstruksi Model

File `.pth` hanya menyimpan **state_dict** (bobot), bukan arsitektur. `build_model()` harus mereplikasi jaringan training **persis**, jika tidak `load_state_dict()` akan melempar *size mismatch* / *unexpected key*.

Custom classifier head (menggantikan head asli DenseNet121):

```
BatchNorm1d(1024)
Linear(1024 → 512)
BatchNorm1d(512)
ReLU(inplace=True)
Dropout(p=0.3197)      ← nilai optimal GWO
Linear(512 → 256)
ReLU(inplace=True)
Dropout(p=0.3197)
Linear(256 → 2)
```

---

## 4. Cara Kerja

**Singleton loading** — panggilan pertama `get_model_bundle()` memuat model, bobot, dan config; panggilan berikutnya mengembalikan instance yang sama. Aman untuk FastAPI (model PyTorch tidak thread-safe, jadi satu instance global + `no_grad` adalah pola yang benar) dan menghindari muat ulang ~2 detik di tiap request.

**Pipeline inference:**
```
PIL.Image → .convert("RGB")
          → Resize(256,256) → CenterCrop(224) → ToTensor → Normalize(ImageNet)
          → unsqueeze(0) → [1,3,224,224] → .to(device)
          → model.eval() + torch.no_grad() → logits [1,2]
          → softmax → probabilities
          → threshold TB 0.45 pada probs[1] (default) atau argmax
          → PredictionResult
```

**Grad-CAM** — gradien terhadap `denseblock4` (dense block terakhir: resolusi spasial tertinggi yang masih semantik) → heatmap [224,224] → overlay di atas citra → `PIL.Image`. Dijalankan di luar `no_grad` karena butuh gradien.

---

## 5. Konfigurasi (tanpa hardcode)

| File | Isi |
|------|-----|
| `metadata.json` | `classifier_head` (dense_units 512, dropout 0.3197), `threshold` 0.45, `threshold_target_class` 1, classes, versi, metrik performa |
| `labels.json` | Mapping index → nama kelas (urutan alfabetis `ImageFolder`: 0 = NON_TBC, 1 = TUBERKULOSIS — **jangan dibalik**) |
| `transforms.json` | Langkah preprocessing inference (Resize, CenterCrop, ToTensor, Normalize) |

---

## 6. Cara Pakai

```python
from PIL import Image
from app.ai.predictor import InferenceEngine

engine = InferenceEngine()                  # model dimuat sekali (singleton)
result = engine.predict(Image.open("xray.png"))
print(result.prediction, result.confidence, result.probabilities)

# argmax murni, tanpa threshold
result = engine.predict(Image.open("xray.png"), use_threshold=False)

# Grad-CAM overlay
overlay = engine.generate_gradcam(Image.open("xray.png"))   # PIL.Image
overlay.save("xray_cam.png")
```

---

## 7. Error Handling & Logging

Ditangani: bobot hilang, config JSON hilang, arsitektur tidak cocok, citra tidak valid/tidak bisa dikonversi RGB, kegagalan forward pass, kegagalan Grad-CAM. Semua melalui exception bertipe agar service layer dapat memetakannya ke HTTP status di Phase 4 tanpa `except Exception` telanjang.

Logger `thoraxvision.ai` mencatat: model loaded (nama + versi + device), inference started, inference completed (kelas, confidence, durasi), dan error.

---

## 8. Hasil Validasi

Uji dengan bobot asli (`densenet121_tb_v1.pth`) dan citra X-ray nyata:

```
PredictionResult(
    prediction='TUBERKULOSIS',
    class_id=1,
    confidence=0.985105,
    probabilities={'NON_TBC': 0.014895, 'TUBERKULOSIS': 0.985105},
    inference_time=2.6374,
    tb_probability=0.985105,
    used_threshold=True
)
```

Terverifikasi:
- Rekonstruksi arsitektur cocok — `load_state_dict()` tanpa error.
- Probabilitas berjumlah 1.0 (softmax benar).
- Singleton mengembalikan instance yang sama pada pemanggilan berulang.
- Grad-CAM mengembalikan `PIL.Image` 224×224 RGB.
- Bobot hilang → `ModelFileNotFoundError` (bukan crash).

Catatan: inference ~2,6 detik di CPU sesuai ekspektasi (panduan: 2–5 detik). Confidence tinggi pada satu sampel **bukan** ukuran performa model — acuannya tetap metrik test set: akurasi 0.7075, AUC 0.8286, sensitivitas TB 0.6391, spesifisitas 0.8381.

---

## 9. Catatan Lingkungan (Windows)

- Gunakan `python -m pip install` (bukan `pip install`) agar paket masuk ke venv yang aktif, bukan Python global.
- Hindari beberapa virtual environment di satu folder (`venv`, `.venv`, `.venv-1`) — pilih satu dan set VS Code interpreter ke `backend\venv\Scripts\python.exe`.
- Torch yang terpasang: `2.6.0+cpu`.

---

## 10. Batasan Fase Ini (sesuai spesifikasi)

Tidak diimplementasikan: endpoint API, upload route, penyimpanan file Grad-CAM, logika database, riwayat prediksi, autentikasi, Docker.

---

## 11. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1 | Scaffolding & inisialisasi | ✅ |
| 1.1 | Refinement arsitektur | ✅ |
| 2 | Database (PostgreSQL + SQLAlchemy + Alembic) | ✅ |
| 3 | AI Inference Engine | ✅ |
| 4 | Endpoint upload + prediksi, simpan original/gradcam/thumbnail, catat ke tabel `predictions` | ⏭️ Berikutnya |
| 5 | Halaman performance, autentikasi, deployment | Direncanakan |
