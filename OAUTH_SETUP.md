# OAuth Setup Guide (Google & Apple Sign-In)

Bu döküman, Stock Simulator iOS uygulamasında Google ve Apple ile OAuth giriş yapmak için gereken tüm adımları içerir.

---

## 🔧 BACKEND KURULUMU

### 1. Environment Variables (.env)

Backend `.env` dosyanıza şu değişkenleri ekleyin:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Apple Sign In
APPLE_CLIENT_ID=com.yourcompany.stocksimulator
APPLE_TEAM_ID=YOUR_APPLE_TEAM_ID
APPLE_KEY_ID=YOUR_APPLE_KEY_ID
APPLE_PRIVATE_KEY_PATH=./config/AuthKey_XXXXX.p8
```

### 2. NPM Packages

Gerekli paketler zaten yüklü:
```bash
npm install google-auth-library apple-signin-auth
```

### 3. Backend API Endpoint

OAuth login endpoint'i:
```
POST /api/auth/oauth
```

**Request Body:**
```json
{
  "provider": "google" | "apple",
  "idToken": "eyJhbGciOiJSUzI1...",
  "username": "optional_custom_username"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OAuth login successful",
  "isNewUser": false,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "totalReturn": 0,
    "portfolioValue": 100000,
    "rank": null,
    "profilePicture": "https://..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

## 📱 iOS SETUP

### GOOGLE SIGN-IN

#### 1. Google Cloud Console Setup

1. [Google Cloud Console](https://console.cloud.google.com/) → Yeni proje oluştur
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **iOS**
5. Bundle ID: `com.yourcompany.stocksimulator` (iOS app bundle ID)
6. Client ID'yi kopyala → Backend `.env` dosyasına ekle

#### 2. iOS Dependencies (Swift Package Manager)

Xcode → File → Add Packages → URL:
```
https://github.com/google/GoogleSignIn-iOS
```

Veya CocoaPods:
```ruby
pod 'GoogleSignIn'
```

#### 3. Info.plist Configuration

`Info.plist` dosyasına ekle:

```xml
<key>GIDClientID</key>
<string>YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### 4. iOS Swift Code

```swift
import GoogleSignIn

class AuthViewModel: ObservableObject {
    @Published var isSignedIn = false
    @Published var errorMessage: String?

    // Google Sign In
    func signInWithGoogle() {
        guard let presentingViewController = (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.windows.first?.rootViewController else { return }

        GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { signInResult, error in
            guard error == nil else {
                self.errorMessage = error!.localizedDescription
                return
            }

            guard let user = signInResult?.user,
                  let idToken = user.idToken?.tokenString else {
                self.errorMessage = "Failed to get ID token"
                return
            }

            // Send to backend
            self.sendOAuthToBackend(provider: "google", idToken: idToken)
        }
    }

    // Send OAuth token to backend
    func sendOAuthToBackend(provider: String, idToken: String) {
        guard let url = URL(string: "http://localhost:3000/api/auth/oauth") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "provider": provider,
            "idToken": idToken
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
                DispatchQueue.main.async {
                    self.errorMessage = error?.localizedDescription
                }
                return
            }

            // Parse response
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let success = json["success"] as? Bool,
               success,
               let token = json["token"] as? String {

                // Save JWT token
                UserDefaults.standard.set(token, forKey: "jwt_token")

                DispatchQueue.main.async {
                    self.isSignedIn = true
                }
            }
        }.resume()
    }
}

// SwiftUI View
struct LoginView: View {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some View {
        VStack {
            Button(action: {
                authViewModel.signInWithGoogle()
            }) {
                HStack {
                    Image(systemName: "g.circle.fill")
                    Text("Sign in with Google")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding()
    }
}
```

---

### APPLE SIGN-IN

#### 1. Apple Developer Setup

1. [Apple Developer](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. App ID seç → **Sign in with Apple** capability'sini enable et
4. **Keys** → Yeni key oluştur → **Sign in with Apple** enable
5. Key ID ve Private Key (.p8 file) indir
6. Team ID: Developer account → **Membership** → Team ID

#### 2. Xcode Capability

Xcode → Target → **Signing & Capabilities** → **+ Capability** → **Sign in with Apple**

#### 3. iOS Swift Code

```swift
import AuthenticationServices

class AuthViewModel: ObservableObject {
    @Published var isSignedIn = false

    // Apple Sign In
    func signInWithApple() {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }
}

// Apple Sign In Delegate
extension AuthViewModel: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            guard let identityToken = appleIDCredential.identityToken,
                  let tokenString = String(data: identityToken, encoding: .utf8) else {
                return
            }

            // Send to backend
            sendOAuthToBackend(provider: "apple", idToken: tokenString)
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        self.errorMessage = error.localizedDescription
    }
}

extension AuthViewModel: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first ?? ASPresentationAnchor()
    }
}

// SwiftUI View - Apple Sign In Button
struct LoginView: View {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some View {
        VStack(spacing: 20) {
            // Apple Sign In Button
            SignInWithAppleButton { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                switch result {
                case .success(let authorization):
                    if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                       let identityToken = appleIDCredential.identityToken,
                       let tokenString = String(data: identityToken, encoding: .utf8) {
                        authViewModel.sendOAuthToBackend(provider: "apple", idToken: tokenString)
                    }
                case .failure(let error):
                    print("Apple Sign In failed: \\(error.localizedDescription)")
                }
            }
            .frame(height: 50)
            .signInWithAppleButtonStyle(.black)

            // Google Sign In Button
            Button(action: {
                authViewModel.signInWithGoogle()
            }) {
                HStack {
                    Image(systemName: "g.circle.fill")
                    Text("Sign in with Google")
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding()
    }
}
```

---

## 🔐 GÜVENLİK

### Backend Tarafı:
- ✅ Token verification (Google/Apple token'ları backend'de verify edilir)
- ✅ JWT token generation (Backend kendi JWT token'ını döner)
- ✅ Email uniqueness check
- ✅ OAuth provider + ID uniqueness

### iOS Tarafı:
- ✅ HTTPS kullanın (production'da)
- ✅ JWT token'ı güvenli şekilde saklayın (Keychain recommended)
- ✅ Token expiration handle edin
- ✅ Refresh token mekanizması ekleyin (opsiyonel)

---

## 🧪 TEST

### Backend Test (cURL):

```bash
# Google OAuth
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "idToken": "YOUR_GOOGLE_ID_TOKEN"
  }'

# Apple OAuth
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "apple",
    "idToken": "YOUR_APPLE_ID_TOKEN"
  }'
```

---

## 📋 CHECKLIST

### Backend:
- [ ] `.env` dosyasına Google Client ID ekle
- [ ] `.env` dosyasına Apple credentials ekle
- [ ] Apple Private Key (.p8) dosyası upload et
- [ ] npm packages yükle
- [ ] Database schema güncellenmiş mi kontrol et

### iOS:
- [ ] Google Client ID `Info.plist`'e ekle
- [ ] URL Scheme `Info.plist`'e ekle
- [ ] Sign in with Apple capability enable
- [ ] GoogleSignIn package yükle
- [ ] OAuth kod implementasyonu
- [ ] Test et

---

## 🆘 TROUBLESHOOTING

### Google Sign In Hataları:

**"Invalid client ID"**
- `.env` dosyasındaki `GOOGLE_CLIENT_ID` doğru mu kontrol et
- iOS `Info.plist`'teki client ID backend ile aynı mı?

**"Network error"**
- Backend çalışıyor mu kontrol et
- Backend OAuth endpoint'i çalışıyor mu test et

### Apple Sign In Hataları:

**"Invalid token"**
- Apple Team ID, Client ID, Key ID doğru mu?
- Private key (.p8) dosyası doğru konumda mı?

**"User cancelled"**
- Kullanıcı giriş işlemini iptal etti (normal durum)

---

## 🎉 ÖZET

1. **Backend**: OAuth servisler hazır ✅
2. **iOS**: Google ve Apple Sign In kodları yukarıda ✅
3. **Flow**: iOS → OAuth Provider → iOS gets token → Backend verify → JWT return ✅

Tüm setup tamamlandığında kullanıcılar:
- Google hesapları ile giriş yapabilecek
- Apple hesapları ile giriş yapabilecek
- Otomatik olarak database'e kaydedilecek
- JWT token alacak ve uygulamayı kullanabilecek
