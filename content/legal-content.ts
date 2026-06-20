export type LegalSection = { title: string; content: string };
export type LegalDocument = { title: string; lastUpdated: string; sections: LegalSection[] };

export const privacyPolicyContent: Record<string, LegalDocument> = {
  tr: {
    title: 'Gizlilik Politikası',
    lastUpdated: 'Son Güncelleme: 19 Haziran 2026',
    sections: [
      {
        title: '1. Giriş',
        content:
          'KlickZeit, TayTek tarafından geliştirilen ücretsiz bir iş zamanı takip uygulamasıdır. Bu politika, uygulamayı kullanırken hangi verilerin toplandığını ve nasıl işlendiğini açıklar.',
      },
      {
        title: '2. Topladığımız Veriler',
        content:
          'Uygulamanın çalışması için aşağıdaki veriler toplanabilir:\n\n• E-posta adresi (e-posta ile giriş, Google veya Apple ile oturum açma)\n• Anonim misafir oturum kimliği (giriş yapmadan kullanım)\n• Giriş/çıkış saatleri, çalışma süreleri, mola ve izin kayıtları\n• Uygulama ayarları (çalışma standartları, dil ve tema tercihleri)\n• Oyun skorları, en iyi süreler ve isteğe bağlı oyun takma adları\n• Misafir kullanıcılara gösterilen Kullanıcı Kodu (örn. KZ-ABCD1234)\n• Cihazınızda yerel olarak saklanan kayıtlar',
      },
      {
        title: '3. Veri Kullanımı',
        content:
          'Toplanan veriler yalnızca şu amaçlarla kullanılır:\n\n• İş zamanı takibi ve uygulama özelliklerini sunmak\n• İsteğe bağlı bulut yedekleme ve cihazlar arası erişim sağlamak\n• Oyun ve liderlik tablosu özelliklerini işletmek\n• Uygulama güncellemelerini kontrol etmek (Firebase Remote Config)\n\nVerileriniz reklam amaçlı kullanılmaz veya üçüncü taraflara satılmaz.',
      },
      {
        title: '4. Veri Saklama ve Görünürlük',
        content:
          'Verileriniz:\n\n• Cihazınızda yerel olarak (AsyncStorage) saklanır\n• Giriş yaptığınızda isteğe bağlı olarak Firebase Firestore\'da yedeklenir\n• Giriş yapmış kullanıcılarda profilde e-posta gösterilir; Kullanıcı Kodu yalnızca misafir kullanıcılara gösterilir\n• Liderlik tablolarında skorlar, takma adlar ve Kullanıcı Kodları diğer kullanıcılara görünebilir\n• Çalışma kayıtlarınız ve ayarlarınız yalnızca hesabınıza bağlıdır',
      },
      {
        title: '5. Güvenlik',
        content:
          'Verilerinizin güvenliği için:\n\n• Firebase Authentication ile güvenli oturum açma\n• Firestore güvenlik kuralları ile erişim kontrolü\n• Veriler şifreli bağlantılar (HTTPS/TLS) üzerinden aktarılır',
      },
      {
        title: '6. Verilerinizi Silme',
        content:
          'Hesabınızı ve verilerinizi silmek için:\n\n• Ayarlar > Hesabı Sil bölümünden hesabınızı kalıcı olarak silebilirsiniz\n• Bu işlem Firebase hesabınızı, bulut kayıtlarınızı ve yerel verilerinizi kaldırır\n• Yalnızca çıkış yapmak istiyorsanız Ayarlar\'dan Çıkış Yap\'ı kullanabilirsiniz\n• Uygulamayı kaldırmak cihazdaki yerel verileri siler',
      },
      {
        title: '7. Üçüncü Taraf Servisler',
        content:
          'Uygulama aşağıdaki servisleri kullanır:\n\n• Firebase (Google): Kimlik doğrulama, Firestore veritabanı ve Remote Config\n• Google Sign-In (Google LLC)\n• Sign in with Apple (Apple Inc.)\n\nBu servislerin kendi gizlilik politikaları geçerlidir.',
      },
      {
        title: '8. İletişim',
        content:
          'Gizlilik ile ilgili sorularınız için:\n\n• GitHub: https://github.com/ttimocin/KlickZeit\n• Issues sayfasından bize ulaşabilirsiniz',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: June 19, 2026',
    sections: [
      {
        title: '1. Introduction',
        content:
          'KlickZeit is a free work time tracking app developed by TayTek. This policy explains what data is collected and how it is processed when you use the app.',
      },
      {
        title: '2. Data We Collect',
        content:
          'The app may collect the following data:\n\n• Email address (email sign-in, Google or Apple sign-in)\n• Anonymous guest session identifier (use without signing in)\n• Check-in/out times, work durations, break and leave records\n• App settings (work standards, language and theme preferences)\n• Game scores, best times and optional game nicknames\n• User Code shown to guest users only (e.g. KZ-ABCD1234)\n• Records stored locally on your device',
      },
      {
        title: '3. How We Use Data',
        content:
          'Collected data is used only to:\n\n• Provide work time tracking and app features\n• Offer optional cloud backup and cross-device access\n• Operate games and leaderboard features\n• Check for app updates (Firebase Remote Config)\n\nYour data is not used for advertising or sold to third parties.',
      },
      {
        title: '4. Storage and Visibility',
        content:
          'Your data is:\n\n• Stored locally on your device (AsyncStorage)\n• Optionally backed up to Firebase Firestore when signed in\n• Email is shown in profile for signed-in users; User Code is shown only to guest users\n• Leaderboard scores, nicknames and User Codes may be visible to other users\n• Work records and settings are linked only to your account',
      },
      {
        title: '5. Security',
        content:
          'To protect your data:\n\n• Secure sign-in with Firebase Authentication\n• Access control with Firestore security rules\n• Data is transmitted over encrypted connections (HTTPS/TLS)',
      },
      {
        title: '6. Deleting Your Data',
        content:
          'To delete your account and data:\n\n• Use Settings > Delete Account to permanently delete your account\n• This removes your Firebase account, cloud records and local data\n• To sign out only, use Sign Out in Settings\n• Uninstalling the app removes local data on the device',
      },
      {
        title: '7. Third-Party Services',
        content:
          'The app uses:\n\n• Firebase (Google): Authentication, Firestore database and Remote Config\n• Google Sign-In (Google LLC)\n• Sign in with Apple (Apple Inc.)\n\nThese services have their own privacy policies.',
      },
      {
        title: '8. Contact',
        content:
          'For privacy questions:\n\n• GitHub: https://github.com/ttimocin/KlickZeit\n• You can reach us via the Issues page',
      },
    ],
  },
  de: {
    title: 'Datenschutzerklärung',
    lastUpdated: 'Zuletzt aktualisiert: 19. Juni 2026',
    sections: [
      { title: '1. Einleitung', content: 'KlickZeit ist eine kostenlose Arbeitszeiterfassungs-App von TayTek. Diese Erklärung beschreibt, welche Daten erhoben und wie sie verarbeitet werden.' },
      { title: '2. Erhobene Daten', content: 'Die App kann folgende Daten erfassen:\n\n• E-Mail-Adresse (E-Mail-Anmeldung, Google oder Apple)\n• Anonyme Gast-Sitzungs-ID\n• Ein-/Ausstempelzeiten, Arbeitszeiten, Pausen und Urlaub\n• App-Einstellungen\n• Spielergebnisse, Bestzeiten und optionale Spitznamen\n• Benutzercode nur für Gäste (z. B. KZ-ABCD1234)\n• Lokal gespeicherte Einträge' },
      { title: '3. Verwendung', content: 'Daten werden nur verwendet für:\n\n• Arbeitszeiterfassung und App-Funktionen\n• Optionale Cloud-Sicherung\n• Spiele und Bestenlisten\n• Update-Prüfung (Firebase Remote Config)\n\nKeine Werbung, kein Verkauf an Dritte.' },
      { title: '4. Speicherung', content: '• Lokal (AsyncStorage)\n• Optional in Firebase Firestore\n• E-Mail im Profil für angemeldete Nutzer; Benutzercode nur für Gäste\n• Bestenlistendaten können für andere sichtbar sein\n• Arbeitsdaten nur mit Ihrem Konto verknüpft' },
      { title: '5. Sicherheit', content: '• Firebase Authentication\n• Firestore-Sicherheitsregeln\n• Verschlüsselte Übertragung (HTTPS/TLS)' },
      { title: '6. Löschung', content: '• Einstellungen > Konto löschen für dauerhafte Löschung\n• Entfernt Firebase-Konto, Cloud- und lokale Daten\n• Abmelden über Einstellungen möglich\n• Deinstallation löscht lokale Daten' },
      { title: '7. Drittanbieter', content: '• Firebase (Google)\n• Google Sign-In\n• Sign in with Apple\n\nEigene Datenschutzrichtlinien der Anbieter gelten.' },
      { title: '8. Kontakt', content: 'GitHub: https://github.com/ttimocin/KlickZeit — Issues-Seite' },
    ],
  },
  fr: {
    title: 'Politique de confidentialité',
    lastUpdated: 'Dernière mise à jour : 19 juin 2026',
    sections: [
      { title: '1. Introduction', content: 'KlickZeit est une application gratuite de suivi du temps de travail développée par TayTek. Cette politique explique quelles données sont collectées et comment elles sont traitées.' },
      { title: '2. Données collectées', content: '• Adresse e-mail (connexion e-mail, Google ou Apple)\n• Identifiant de session invité anonyme\n• Heures d\'entrée/sortie, durées de travail, pauses et congés\n• Paramètres de l\'application\n• Scores de jeu, meilleurs temps et pseudonymes optionnels\n• Code utilisateur affiché uniquement aux invités (ex. KZ-ABCD1234)\n• Enregistrements locaux sur l\'appareil' },
      { title: '3. Utilisation', content: 'Les données servent uniquement à fournir les fonctionnalités, la sauvegarde cloud optionnelle, les jeux/classements et la vérification des mises à jour. Pas de publicité ni de vente à des tiers.' },
      { title: '4. Stockage', content: '• Stockage local (AsyncStorage)\n• Sauvegarde cloud Firebase optionnelle\n• E-mail visible pour les utilisateurs connectés ; code utilisateur uniquement pour les invités\n• Classements visibles par d\'autres utilisateurs\n• Données de travail liées à votre compte' },
      { title: '5. Sécurité', content: 'Authentification Firebase, règles Firestore et connexions chiffrées (HTTPS/TLS).' },
      { title: '6. Suppression', content: 'Paramètres > Supprimer le compte pour une suppression définitive. Déconnexion possible séparément. Désinstallation supprime les données locales.' },
      { title: '7. Services tiers', content: 'Firebase (Google), Google Sign-In, Sign in with Apple — politiques de confidentialité propres à chaque service.' },
      { title: '8. Contact', content: 'GitHub : https://github.com/ttimocin/KlickZeit — page Issues' },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    lastUpdated: 'Última atualização: 19 de junho de 2026',
    sections: [
      { title: '1. Introdução', content: 'KlickZeit é um aplicativo gratuito de controle de tempo de trabalho da TayTek. Esta política explica quais dados são coletados e como são processados.' },
      { title: '2. Dados coletados', content: '• E-mail (login por e-mail, Google ou Apple)\n• ID de sessão convidado anônimo\n• Horários de entrada/saída, durações, pausas e férias\n• Configurações do app\n• Pontuações, melhores tempos e apelidos opcionais\n• Código de usuário apenas para convidados (ex. KZ-ABCD1234)\n• Registros locais no dispositivo' },
      { title: '3. Uso', content: 'Dados usados apenas para funcionalidades, backup na nuvem opcional, jogos/rankings e verificação de atualizações. Sem publicidade ou venda a terceiros.' },
      { title: '4. Armazenamento', content: '• Local (AsyncStorage)\n• Backup Firebase opcional\n• E-mail no perfil para usuários logados; código só para convidados\n• Rankings visíveis a outros usuários\n• Dados de trabalho vinculados à sua conta' },
      { title: '5. Segurança', content: 'Firebase Authentication, regras Firestore e transmissão criptografada (HTTPS/TLS).' },
      { title: '6. Exclusão', content: 'Configurações > Excluir conta para remoção permanente. Sair separadamente disponível. Desinstalar remove dados locais.' },
      { title: '7. Terceiros', content: 'Firebase (Google), Google Sign-In, Sign in with Apple.' },
      { title: '8. Contato', content: 'GitHub: https://github.com/ttimocin/KlickZeit — página Issues' },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    lastUpdated: 'آخر تحديث: 19 يونيو 2026',
    sections: [
      { title: '1. مقدمة', content: 'KlickZeit تطبيق مجاني لتتبع وقت العمل من TayTek. توضح هذه السياسة البيانات التي يتم جمعها وكيفية معالجتها.' },
      { title: '2. البيانات المجمعة', content: '• البريد الإلكتروني (تسجيل بالبريد أو Google أو Apple)\n• معرف جلسة ضيف مجهول\n• أوقات الدخول/الخروج ومدد العمل والإجازات\n• إعدادات التطبيق\n• نتائج الألعاب وأفضل الأوقات والأسماء المستعارة\n• رمز المستخدم للضيوف فقط (مثل KZ-ABCD1234)\n• سجلات محلية على الجهاز' },
      { title: '3. الاستخدام', content: 'تُستخدم البيانات فقط لتقديم الميزات والنسخ الاحتياطي السحابي الاختياري والألعاب ولوحات الصدارة والتحقق من التحديثات. لا إعلانات ولا بيع لأطراف ثالثة.' },
      { title: '4. التخزين', content: '• محليًا (AsyncStorage)\n• نسخ احتياطي Firebase اختياري\n• البريد للمستخدمين المسجلين؛ الرمز للضيوف فقط\n• لوحات الصدارة مرئية للآخرين\n• بيانات العمل مرتبطة بحسابك' },
      { title: '5. الأمان', content: 'مصادقة Firebase وقواعد Firestore واتصالات مشفرة (HTTPS/TLS).' },
      { title: '6. الحذف', content: 'الإعدادات > حذف الحساب للحذف الدائم. تسجيل الخروج منفصل. إلغاء التثبيت يحذف البيانات المحلية.' },
      { title: '7. خدمات الطرف الثالث', content: 'Firebase (Google)، Google Sign-In، Sign in with Apple.' },
      { title: '8. الاتصال', content: 'GitHub: https://github.com/ttimocin/KlickZeit — صفحة Issues' },
    ],
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年6月19日',
    sections: [
      { title: '1. 简介', content: 'KlickZeit 是 TayTek 开发的免费工作时间追踪应用。本政策说明收集的数据及处理方式。' },
      { title: '2. 收集的数据', content: '• 电子邮件（邮箱、Google 或 Apple 登录）\n• 匿名访客会话 ID\n• 签到/签退时间、工作时长、休息和休假记录\n• 应用设置\n• 游戏分数、最佳时间和可选昵称\n• 仅向访客显示的用户代码（如 KZ-ABCD1234）\n• 设备本地记录' },
      { title: '3. 数据使用', content: '数据仅用于提供功能、可选云备份、游戏/排行榜和更新检查。不用于广告或出售给第三方。' },
      { title: '4. 存储', content: '• 本地存储 (AsyncStorage)\n• 可选 Firebase 云备份\n• 登录用户显示邮箱；访客显示用户代码\n• 排行榜对其他用户可见\n• 工作数据仅与您的账户关联' },
      { title: '5. 安全', content: 'Firebase 身份验证、Firestore 安全规则和加密传输 (HTTPS/TLS)。' },
      { title: '6. 删除', content: '设置 > 删除账户可永久删除。可单独退出登录。卸载应用删除本地数据。' },
      { title: '7. 第三方服务', content: 'Firebase (Google)、Google Sign-In、Sign in with Apple。' },
      { title: '8. 联系', content: 'GitHub: https://github.com/ttimocin/KlickZeit — Issues 页面' },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление: 19 июня 2026 г.',
    sections: [
      { title: '1. Введение', content: 'KlickZeit — бесплатное приложение учёта рабочего времени от TayTek. Эта политика описывает собираемые данные и их обработку.' },
      { title: '2. Собираемые данные', content: '• Электронная почта (вход по email, Google или Apple)\n• Анонимный ID гостевой сессии\n• Время прихода/ухода, перерывы и отпуска\n• Настройки приложения\n• Игровые результаты и псевдонимы\n• Код пользователя только для гостей (напр. KZ-ABCD1234)\n• Локальные записи' },
      { title: '3. Использование', content: 'Данные используются только для функций приложения, облачного резервирования, игр/рейтингов и проверки обновлений. Без рекламы и продажи третьим лицам.' },
      { title: '4. Хранение', content: '• Локально (AsyncStorage)\n• Опционально Firebase Firestore\n• Email для авторизованных; код только для гостей\n• Рейтинги видны другим пользователям' },
      { title: '5. Безопасность', content: 'Firebase Authentication, правила Firestore, шифрованная передача (HTTPS/TLS).' },
      { title: '6. Удаление', content: 'Настройки > Удалить аккаунт — полное удаление. Выход отдельно. Удаление приложения стирает локальные данные.' },
      { title: '7. Сторонние сервисы', content: 'Firebase (Google), Google Sign-In, Sign in with Apple.' },
      { title: '8. Контакт', content: 'GitHub: https://github.com/ttimocin/KlickZeit — страница Issues' },
    ],
  },
  uk: {
    title: 'Політика конфіденційності',
    lastUpdated: 'Останнє оновлення: 19 червня 2026 р.',
    sections: [
      { title: '1. Вступ', content: 'KlickZeit — безкоштовний додаток обліку робочого часу від TayTek. Ця політика описує збір і обробку даних.' },
      { title: '2. Збираємі дані', content: '• Електронна пошта (вхід через email, Google або Apple)\n• Анонімний ID гостьової сесії\n• Час приходу/виходу, перерви та відпустки\n• Налаштування додатку\n• Ігрові результати та псевдоніми\n• Код користувача лише для гостей (напр. KZ-ABCD1234)\n• Локальні записи' },
      { title: '3. Використання', content: 'Дані використовуються лише для функцій додатку, хмарного резервування, ігор/рейтингів і перевірки оновлень. Без реклами та продажу третім особам.' },
      { title: '4. Зберігання', content: '• Локально (AsyncStorage)\n• Опціонально Firebase Firestore\n• Email для авторизованих; код лише для гостей\n• Рейтинги видно іншим користувачам' },
      { title: '5. Безпека', content: 'Firebase Authentication, правила Firestore, зашифрована передача (HTTPS/TLS).' },
      { title: '6. Видалення', content: 'Налаштування > Видалити обліковий запис — повне видалення. Окремий вихід. Видалення додатку стирає локальні дані.' },
      { title: '7. Сторонні сервіси', content: 'Firebase (Google), Google Sign-In, Sign in with Apple.' },
      { title: '8. Контакт', content: 'GitHub: https://github.com/ttimocin/KlickZeit — сторінка Issues' },
    ],
  },
};

export const termsOfServiceContent: Record<string, LegalDocument> = {
  tr: {
    title: 'Kullanım Koşulları',
    lastUpdated: 'Son Güncelleme: 19 Haziran 2026',
    sections: [
      {
        title: '1. Kabul',
        content:
          'KlickZeit uygulamasını kullanarak bu Kullanım Koşullarını kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.',
      },
      {
        title: '2. Hizmet Açıklaması',
        content:
          'KlickZeit ücretsiz ve reklamsız bir mobil uygulamadır. Uygulama:\n\n• İşe giriş/çıkış saatlerinizi kaydetmenizi sağlar\n• Çalışma süreleri, molalar ve izin takibi sunar\n• İsteğe bağlı Firebase bulut yedeklemesi ve geri yükleme sağlar\n• Sudoku, Snake ve Tetris gibi oyunlar ve liderlik tabloları içerir\n• CSV formatında veri dışa aktarma sunar',
      },
      {
        title: '3. Hesaplar ve Kimlik Doğrulama',
        content:
          'Uygulamayı misafir olarak veya e-posta, Google ya da Apple ile giriş yaparak kullanabilirsiniz.\n\n• Misafir kullanıcılara Kullanıcı Kodu atanır\n• Giriş yapmış kullanıcılarda profilde e-posta gösterilir\n• Hesap bilgilerinizin güvenliğinden siz sorumlusunuz',
      },
      {
        title: '4. Kullanıcı Sorumlulukları',
        content:
          'Uygulamayı kullanırken:\n\n• Kayıtlarınızın doğruluğundan siz sorumlusunuz\n• Uygulamayı yasadışı amaçlarla kullanamazsınız\n• Başkalarının hesaplarına erişmeye çalışamazsınız\n• Liderlik tablolarında hile veya manipülasyon yapamazsınız',
      },
      {
        title: '5. Hizmet Kullanılabilirliği',
        content:
          'KlickZeit kesintisiz hizmet sunmaya çalışır ancak:\n\n• Bakım veya güncellemeler nedeniyle kesintiler olabilir\n• Bulut senkronizasyonu internet bağlantısı gerektirir\n• Uygulama çevrimdışı modda temel özelliklerle çalışabilir',
      },
      {
        title: '6. Fikri Mülkiyet',
        content:
          'KlickZeit ve içeriği telif hakkı yasalarıyla korunur. Uygulama MIT Lisansı altında açık kaynaklıdır: https://github.com/ttimocin/KlickZeit',
      },
      {
        title: '7. Sorumluluk Reddi',
        content:
          'KlickZeit "olduğu gibi" sunulur. Veri kaybı veya uygulama kullanımından doğan zararlardan TayTek sorumlu tutulamaz. Önemli verilerinizi düzenli yedeklemeniz önerilir.',
      },
      {
        title: '8. Hesap Sonlandırma',
        content:
          'Hesabınızı Ayarlar > Hesabı Sil bölümünden kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz ve tüm verileriniz silinir.',
      },
      {
        title: '9. Değişiklikler ve İletişim',
        content:
          'Bu koşullar güncellenebilir. Önemli değişiklikler uygulama içinde duyurulabilir. Sorularınız için GitHub Issues: https://github.com/ttimocin/KlickZeit',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: June 19, 2026',
    sections: [
      { title: '1. Acceptance', content: 'By using KlickZeit you agree to these Terms of Service. If you do not agree, do not use the app.' },
      { title: '2. Service Description', content: 'KlickZeit is a free, ad-free mobile app that:\n\n• Records work check-in/out times\n• Tracks work durations, breaks and leave\n• Offers optional Firebase cloud backup and restore\n• Includes games (Sudoku, Snake, Tetris) and leaderboards\n• Provides CSV data export' },
      { title: '3. Accounts', content: 'You may use the app as a guest or sign in with email, Google or Apple.\n\n• Guest users receive a User Code\n• Signed-in users see email in profile\n• You are responsible for account security' },
      { title: '4. User Responsibilities', content: 'You must:\n\n• Ensure accuracy of your records\n• Not use the app for illegal purposes\n• Not access others\' accounts\n• Not cheat or manipulate leaderboards' },
      { title: '5. Availability', content: 'We strive for uninterrupted service but maintenance, updates or connectivity issues may occur. Cloud sync requires internet. Core features work offline.' },
      { title: '6. Intellectual Property', content: 'KlickZeit is protected by copyright and open source under the MIT License: https://github.com/ttimocin/KlickZeit' },
      { title: '7. Disclaimer', content: 'KlickZeit is provided "AS IS". TayTek is not liable for data loss or damages from app use. We recommend regular backups.' },
      { title: '8. Account Termination', content: 'Delete your account permanently via Settings > Delete Account. This cannot be undone and removes all your data.' },
      { title: '9. Changes and Contact', content: 'Terms may be updated. Material changes may be announced in-app. Questions: GitHub Issues at https://github.com/ttimocin/KlickZeit' },
    ],
  },
  de: {
    title: 'Nutzungsbedingungen',
    lastUpdated: 'Zuletzt aktualisiert: 19. Juni 2026',
    sections: [
      { title: '1. Annahme', content: 'Mit der Nutzung von KlickZeit akzeptieren Sie diese Bedingungen.' },
      { title: '2. Dienst', content: 'Kostenlose App für Arbeitszeiterfassung, optionale Cloud-Sicherung, Spiele/Bestenlisten und CSV-Export. Werbefrei.' },
      { title: '3. Konten', content: 'Nutzung als Gast oder mit E-Mail, Google oder Apple. Gäste erhalten einen Benutzercode; angemeldete Nutzer sehen die E-Mail im Profil.' },
      { title: '4. Pflichten', content: 'Korrekte Daten, keine illegalen Zwecke, kein Zugriff auf fremde Konten, kein Betrug in Bestenlisten.' },
      { title: '5. Verfügbarkeit', content: 'Wartung und Verbindungsprobleme möglich. Cloud-Sync benötigt Internet. Kernfunktionen offline verfügbar.' },
      { title: '6. Eigentum', content: 'Open Source unter MIT-Lizenz: https://github.com/ttimocin/KlickZeit' },
      { title: '7. Haftung', content: 'Bereitstellung „wie besehen“. Keine Haftung für Datenverlust. Regelmäßige Backups empfohlen.' },
      { title: '8. Kündigung', content: 'Konto dauerhaft unter Einstellungen > Konto löschen entfernen. Unwiderruflich.' },
      { title: '9. Änderungen', content: 'Bedingungen können aktualisiert werden. Kontakt: GitHub Issues.' },
    ],
  },
  fr: {
    title: 'Conditions d\'utilisation',
    lastUpdated: 'Dernière mise à jour : 19 juin 2026',
    sections: [
      { title: '1. Acceptation', content: 'En utilisant KlickZeit, vous acceptez ces conditions.' },
      { title: '2. Service', content: 'Application gratuite de suivi du temps, sauvegarde cloud optionnelle, jeux/classements et export CSV. Sans publicité.' },
      { title: '3. Comptes', content: 'Utilisation en invité ou avec e-mail, Google ou Apple. Code utilisateur pour les invités ; e-mail visible pour les utilisateurs connectés.' },
      { title: '4. Responsabilités', content: 'Données exactes, usage légal, pas d\'accès aux comptes d\'autrui, pas de triche aux classements.' },
      { title: '5. Disponibilité', content: 'Maintenance et connexion possibles. Sync cloud nécessite Internet. Fonctions de base hors ligne.' },
      { title: '6. Propriété', content: 'Open source sous licence MIT : https://github.com/ttimocin/KlickZeit' },
      { title: '7. Responsabilité', content: 'Fourni « tel quel ». Pas de responsabilité pour perte de données. Sauvegardes recommandées.' },
      { title: '8. Résiliation', content: 'Suppression définitive via Paramètres > Supprimer le compte.' },
      { title: '9. Modifications', content: 'Conditions susceptibles d\'être mises à jour. Contact : GitHub Issues.' },
    ],
  },
  pt: {
    title: 'Termos de Serviço',
    lastUpdated: 'Última atualização: 19 de junho de 2026',
    sections: [
      { title: '1. Aceitação', content: 'Ao usar o KlickZeit, você concorda com estes termos.' },
      { title: '2. Serviço', content: 'App gratuito de controle de tempo, backup na nuvem opcional, jogos/rankings e exportação CSV. Sem anúncios.' },
      { title: '3. Contas', content: 'Uso como convidado ou com e-mail, Google ou Apple. Código para convidados; e-mail no perfil para logados.' },
      { title: '4. Responsabilidades', content: 'Dados corretos, uso legal, sem acesso a contas alheias, sem trapaça em rankings.' },
      { title: '5. Disponibilidade', content: 'Manutenção e conexão podem afetar o serviço. Sync requer internet. Recursos básicos offline.' },
      { title: '6. Propriedade', content: 'Código aberto sob licença MIT: https://github.com/ttimocin/KlickZeit' },
      { title: '7. Isenção', content: 'Fornecido "como está". Sem responsabilidade por perda de dados. Backups recomendados.' },
      { title: '8. Encerramento', content: 'Exclusão permanente em Configurações > Excluir conta.' },
      { title: '9. Alterações', content: 'Termos podem ser atualizados. Contato: GitHub Issues.' },
    ],
  },
  ar: {
    title: 'شروط الخدمة',
    lastUpdated: 'آخر تحديث: 19 يونيو 2026',
    sections: [
      { title: '1. القبول', content: 'باستخدام KlickZeit فإنك توافق على هذه الشروط.' },
      { title: '2. الخدمة', content: 'تطبيق مجاني لتتبع وقت العمل، نسخ سحابي اختياري، ألعاب ولوحات صدارة وتصدير CSV. بدون إعلانات.' },
      { title: '3. الحسابات', content: 'استخدام كضيف أو بتسجيل البريد أو Google أو Apple. رمز للضيوف؛ البريد للمسجلين.' },
      { title: '4. المسؤوليات', content: 'دقة البيانات، استخدام قانوني، عدم الوصول لحسابات الآخرين، عدم الغش في لوحات الصدارة.' },
      { title: '5. التوفر', content: 'قد تحدث صيانة أو مشاكل اتصال. المزامنة تتطلب إنترنت. الميزات الأساسية تعمل دون اتصال.' },
      { title: '6. الملكية', content: 'مفتوح المصدر بموجب ترخيص MIT: https://github.com/ttimocin/KlickZeit' },
      { title: '7. إخلاء المسؤولية', content: 'يُقدَّم "كما هو". لا مسؤولية عن فقدان البيانات. يُنصح بالنسخ الاحتياطي.' },
      { title: '8. الإنهاء', content: 'حذف دائم عبر الإعدادات > حذف الحساب.' },
      { title: '9. التغييرات', content: 'قد تُحدَّث الشروط. التواصل: GitHub Issues.' },
    ],
  },
  zh: {
    title: '服务条款',
    lastUpdated: '最后更新：2026年6月19日',
    sections: [
      { title: '1. 接受', content: '使用 KlickZeit 即表示您同意这些条款。' },
      { title: '2. 服务', content: '免费工作时间追踪应用，可选云备份、游戏/排行榜和 CSV 导出。无广告。' },
      { title: '3. 账户', content: '可作为访客或使用电子邮件、Google 或 Apple 登录。访客获得用户代码；登录用户显示邮箱。' },
      { title: '4. 责任', content: '确保数据准确、合法使用、不访问他人账户、不在排行榜作弊。' },
      { title: '5. 可用性', content: '维护和连接问题可能发生。云同步需互联网。核心功能可离线使用。' },
      { title: '6. 知识产权', content: 'MIT 许可证开源：https://github.com/ttimocin/KlickZeit' },
      { title: '7. 免责声明', content: '按"原样"提供。不对数据丢失负责。建议定期备份。' },
      { title: '8. 终止', content: '通过设置 > 删除账户永久删除。' },
      { title: '9. 变更', content: '条款可能更新。联系：GitHub Issues。' },
    ],
  },
  ru: {
    title: 'Условия использования',
    lastUpdated: 'Последнее обновление: 19 июня 2026 г.',
    sections: [
      { title: '1. Принятие', content: 'Используя KlickZeit, вы соглашаетесь с этими условиями.' },
      { title: '2. Сервис', content: 'Бесплатное приложение учёта времени, облачное резервирование, игры/рейтинги и экспорт CSV. Без рекламы.' },
      { title: '3. Аккаунты', content: 'Гость или вход через email, Google или Apple. Код для гостей; email в профиле для авторизованных.' },
      { title: '4. Обязанности', content: 'Точность данных, законное использование, без доступа к чужим аккаунтам и читерства в рейтингах.' },
      { title: '5. Доступность', content: 'Возможны обслуживание и проблемы с сетью. Синхронизация требует интернет. Основные функции офлайн.' },
      { title: '6. Собственность', content: 'Открытый код под MIT: https://github.com/ttimocin/KlickZeit' },
      { title: '7. Отказ', content: 'Предоставляется «как есть». Нет ответственности за потерю данных. Рекомендуем резервные копии.' },
      { title: '8. Удаление', content: 'Полное удаление: Настройки > Удалить аккаунт.' },
      { title: '9. Изменения', content: 'Условия могут обновляться. Контакт: GitHub Issues.' },
    ],
  },
  uk: {
    title: 'Умови використання',
    lastUpdated: 'Останнє оновлення: 19 червня 2026 р.',
    sections: [
      { title: '1. Прийняття', content: 'Використовуючи KlickZeit, ви погоджуєтесь з цими умовами.' },
      { title: '2. Послуга', content: 'Безкоштовний додаток обліку часу, хмарне резервування, ігри/рейтинги та експорт CSV. Без реклами.' },
      { title: '3. Облікові записи', content: 'Гість або вхід через email, Google або Apple. Код для гостей; email у профілі для авторизованих.' },
      { title: '4. Обов\'язки', content: 'Точність даних, законне використання, без доступу до чужих облікових записів і читерства.' },
      { title: '5. Доступність', content: 'Можливе обслуговування та проблеми з мережею. Синхронізація потребує інтернет. Основні функції офлайн.' },
      { title: '6. Власність', content: 'Відкритий код під MIT: https://github.com/ttimocin/KlickZeit' },
      { title: '7. Відмова', content: 'Надається «як є». Немає відповідальності за втрату даних. Рекомендуємо резервні копії.' },
      { title: '8. Видалення', content: 'Повне видалення: Налаштування > Видалити обліковий запис.' },
      { title: '9. Зміни', content: 'Умови можуть оновлюватися. Контакт: GitHub Issues.' },
    ],
  },
};
