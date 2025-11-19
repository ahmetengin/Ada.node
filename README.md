
# Ada Node Observer

### Hiper-Kişiselleştirilmiş, Çoklu-Ajanlı bir Yapay Zeka Ekosisteminin Canlı Gözlem Arayüzü

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

`Ada Node Observer`, basit bir yapay zeka sohbet arayüzü değildir. Bu, bir grup uzmanlaşmış yapay zeka ajanının, bir **Usta Kontrol Programı (MCP)** tarafından yönetilerek, karmaşık görevleri proaktif ve bağlama duyarlı bir şekilde nasıl çözdüğünü gösteren, canlı ve dinamik bir simülasyon ve gözlem platformudur.

Bu proje, bir müşterinin dijital ikizini oluşturarak, onun tüm yaşam tarzını, tercihlerini ve varlıklarını 360 derece anlayan ve bu bilgiyi kullanarak kişiselleştirilmiş hizmetler sunan bir sistemin potansiyelini sergilemektedir.

 
*(Not: Bu, arayüzün statik bir temsilidir. Gerçek arayüz, canlı animasyonlar ve veri akışları içerir.)*

## 🏛️ Temel Felsefe: MCP ve Uzmanlar Orkestrası

Monolitik, her işi yapmaya çalışan "süper ajanlar" yerine, `Ada` mimarisi bir orkestra şefi (MCP) ve her biri kendi enstrümanında usta olan bir müzisyenler topluluğu (uzman ajanlar ve araçlar) felsefesine dayanır. MCP, gelen görevin doğasını anlar, doğru uzmanları göreve atar, onların çıktılarını sentezler ve en iyi kararı verir. Bu yaklaşım, Anthropic ve endüstri liderlerinin benimsediği gibi, hem **token maliyetlerini dramatik şekilde düşürür** hem de **sistemin güvenilirliğini ve doğruluğunu artırır.**

## ✨ Anahtar Özellikler

### 1. Dinamik İş Akışı Motoru (MCP'nin Beyni)
MCP, statik görev listeleri çalıştırmaz. Bir istek geldiğinde, müşteri profilini analiz eder ve o göreve özel, çok adımlı bir **dinamik iş akışı oluşturur**. Bu süreç, aktivite log'unda `MCP_DECISION` ve `WORKFLOW_STEP` etiketleriyle anlık olarak gözlemlenebilir.

### 2. Proaktif Bağlam Zenginleştirme (CRM'in Kalbi)
Bir görev, "kimin için" yapıldığını bilmeden başlamaz. MCP, bir görev geldiğinde ilk olarak `CRM Agent`'ı devreye sokar, müşteri profilini çeker ve bu zengin bağlamı (tercihler, geçmiş, varlıklar) görevin sonraki adımlarına bir girdi olarak sunar.

### 3. Akıllı Görev Zincirleme (TKCONNECT Modeli)
Sistem, bir görevi tamamlamak için birden çok ajanı ve aracı mantıksal bir sıra ile çalıştırabilir. Örneğin, bir seyahat planı için önce `CRM Agent` ile müşteri doğrulanır, sonra `Travel Agent` ile mil durumu kontrol edilir ve en son olarak bu bilgilerle kişiselleştirilmiş bir uçuş araması yapılır.

### 4. MAKER Modu & SEAL (Güven Katmanı)
*   **MAKER (Multi-Agent Konsensus ve Error Recovery):** Kritik görevlerde, MCP birden çok sağlayıcıyı (provider) çalıştırır ve sonuçlar arasında bir fikir birliği (konsensüs) arar. Bu, sistemin kendi kendini denetlemesini ve hatalı sonuçları elemesini sağlar.
*   **SEAL:** Fikir birliğinden geçen veya başarıyla tamamlanan her görev, geri dönülmez bir şekilde "mühürlenir". Bu işlem, aktivite log'una `SEAL` olarak damgalanır ve sistemin durumunu kalıcı hale getirir (checkpoint).

### 5. Derin Gözlemlenebilirlik
Bu projenin temel amacı, karmaşık bir ajan ekosisteminin iç işleyişini şeffaf hale getirmektir.
*   **Framework Paneli:** Sistemin tüm mimarisini (Ajanlar -> Beceriler -> Sağlayıcılar -> Araçlar) canlı bir harita gibi gösterir.
*   **Aktivite Log'u:** Filtrelenebilir log sistemi, MCP'nin "düşünce zincirini" adım adım takip etmenizi sağlar.
*   **Node Paneli:** Tüm ajanların anlık durumunu ve aralarındaki veri akışını görselleştirir.

## 🤖 Ajan Ekosistemi

`Ada`, bir müşterinin lüks yaşam tarzının her yönünü yönetebilecek şekilde tasarlanmış, genişletilebilir bir ajan ekosistemine sahiptir:

*   **`CRM Agent`**: Müşteri verilerinin tek doğruluk kaynağı. Tercihler, aile, varlıklar ve daha fazlası.
*   **`Travel Agent`**: Uçuş, konaklama ve seyahat planlaması uzmanı. `turkish_airlines` gibi özel sağlayıcılarla entegre olabilir.
*   **`Maritime Agent`**: Yat ve marina operasyonlarını yönetir (`ada.sea`, `ada.marina`).
*   **`Finance Agent`**: Ödeme, kredi durumu ve finansal işlemleri yürütür.
*   ...ve gelecekte eklenebilecek daha birçok uzman (`ada.art`, `ada.health` vb.).

## 🚀 Teknoloji Mimarisi

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Yapay Zeka:** Google Gemini API (`gemini-2.5-flash`)
*   **Görselleştirme:** Lucide Icons
*   **Canlı İletişim:** WebRTC, TensorFlow.js (Body Segmentation)
*   **Mimari:** Modüler servisler, merkezi yapılandırma (`agentFrameworkConfig.ts`)

## 🛠️ Kurulum ve Başlatma

1.  **Repo'yu Klonlayın:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    Proje kök dizininde `.env` adında bir dosya oluşturun ve Google Gemini API anahtarınızı ekleyin:
    ```
    API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    npm start
    ```
    Uygulama, yerel geliştirme sunucusu tarafından sağlanan bir adreste çalışmaya başlayacaktır.

## 🔮 Vizyon: Kodun Ötesi

Bu proje, bir teknoloji demosundan daha fazlasıdır. Bu, yıllık cirosu **€85 Milyon**'u aşma potansiyeline sahip, yüksek gelir grubuna yönelik bir **dijital yaşam tarzı ve varlık yönetimi platformunun** çalışan bir prototipidir. Değer önerisi, sadece görevleri otomatikleştirmek değil, aynı zamanda müşterinin ihtiyaçlarını proaktif olarak öngörmek ve hiper-kişiselleştirilmiş, benzersiz bir deneyim sunmaktır.

## 🙏 İlham ve Teşekkür

Bu projenin mimarisi ve felsefesi, aşağıdaki kaynaklardan ve vizyoner çalışmalardan derinden etkilenmiştir:

*   **[ahmetengin/Ada](https://github.com/ahmetengin/Ada):** Projenin temel felsefesini ve hiper-kişiselleştirme vizyonunu ateşleyen ana ilham kaynağı.
*   **Indydev Dan (Danilo Poccia):** Çoklu-ajan sistemleri ve MCP mimarisi üzerine yaptığı aydınlatıcı çalışmalar.
    *   [disler/big-3-super-agent](https://github.com/disler/big-3-super-agent)
    *   [disler/claude-code-hooks-multi-agent-observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
*   **Anthropic:** Usta Kontrol Programı (MCP) konseptini ve kod yürütme ile ilgili mühendislik blog yazıları.
    *   [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)

---