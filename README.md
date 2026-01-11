# Excel to Folder Generator

Excel dosyalarınızdan otomatik klasör yapıları oluşturan ve zip olarak indirmenizi sağlayan modern bir web uygulaması.

## ✨ Özellikler

- **Excel Dosyası Yükleme**: Xlsx formatındaki Excel dosyalarını kolayca yükleyin
- **Sheet Seçimi**: Excel dosyasındaki sheet'leri görüntüleyin ve seçin
- **Kolon Hiyerarşisi**: Klasör yapısını oluşturacak kolonları hiyerarşik olarak seçin
- **Kolon Değerlerini Görüntüleme**: Seçilen kolonlardaki tekrar etmeyen değerleri görüntüleyin
- **Klasör Adı Özelleştirme**: Excel kolon adı ve klasör adı eşleştirmesi yapın (Mudanya → 1-Mudanya gibi)
- **Title Case Desteği**: Klasör isimleri otomatik olarak title case formatında oluşturulur
- **Zip İndirme**: Oluşturulan klasör yapısını zip dosyası olarak indirin

## 🛠️ Teknoloji Yığını

- **⚡ Next.js 15** - React framework for production with App Router
- **📘 TypeScript** - Type-safe JavaScript
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🧩 Radix UI** - Accessible UI components
- **📊 ExcelJS** - Excel dosyalarını okumak için
- **📦 Archiver** - Zip dosyası oluşturmak için

## 🚀 Kurulum

```bash
# Bağımlılıkları yükleyin
bun install

# Geliştirme sunucusunu başlatın
bun run dev

# Production için build alın
bun run build

# Production sunucusunu başlatın
bun start
```

Uygulamayı [http://localhost:3000](http://localhost:3000) adresinden açın.

## 📁 Kullanım

1. **Excel Dosyasını Yükleyin**: Sürükle-bırak veya dosya seçimi ile xlsx dosyanızı yükleyin
2. **Sheet Seçin**: Excel dosyanızdaki sheet'lerden birini seçin
3. **Kolonları Seçin**: Klasör yapısını oluşturacak kolonları hiyerarşik olarak seçin (örn: ilçe, mahalle, ada, parsel)
4. **Değerleri Görüntüleyin**: Seçilen kolonlardaki tekrar etmeyen değerleri görüntüleyin
5. **Klasör Adlarını Özelleştirin**: Excel kolon adı ve klasör adı eşleştirmesi yapın (Mudanya → 1-Mudanya gibi)
6. **Zip İndirin**: Oluşturulan klasör yapısını zip dosyası olarak indirin

## 🐳 Docker ile Çalıştırma

```bash
# Docker imajı oluşturun
docker build -t excel-folder-generator .

# Docker container'ı başlatın
docker run -p 3000:3000 excel-folder-generator

# Veya docker-compose kullanın
docker-compose up
```

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

Barış Arıburnu - [GitHub](https://github.com/barisariburnu)

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen fork yapın ve pull request gönderin.
