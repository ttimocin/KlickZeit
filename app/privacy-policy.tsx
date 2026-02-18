import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const styles = createStyles(isDark);

  const content = {
    tr: {
      title: 'Gizlilik Politikası',
      lastUpdated: 'Son Güncelleme: 2025',
      sections: [
        {
          title: '1. Veri Toplama',
          content: 'ZeitLog, işe giriş-çıkış saatlerinizi kaydetmek için aşağıdaki verileri toplar:\n\n• E-posta adresi (Firebase Authentication için)\n• Giriş/çıkış saatleri ve tarihleri\n• Çalışma süreleri\n• Cihazınızda yerel olarak saklanan kayıtlar',
        },
        {
          title: '2. Veri Kullanımı',
          content: 'Toplanan veriler sadece şu amaçlarla kullanılır:\n\n• Uygulamanın temel işlevselliğini sağlamak\n• Verilerinizi Firebase üzerinden yedeklemek\n• Farklı cihazlarda verilerinize erişmenizi sağlamak\n\nVerileriniz hiçbir zaman üçüncü taraflarla paylaşılmaz veya reklam amaçlı kullanılmaz.',
        },
        {
          title: '3. Veri Saklama',
          content: 'Verileriniz:\n\n• Cihazınızda yerel olarak (AsyncStorage) saklanır\n• İsteğe bağlı olarak Firebase Firestore\'da bulut yedekleme olarak saklanır\n• Verileriniz sadece sizin hesabınıza bağlıdır ve başka kullanıcılar erişemez',
        },
        {
          title: '4. Güvenlik',
          content: 'Verilerinizin güvenliği için:\n\n• Firebase Authentication ile güvenli giriş\n• Firestore Security Rules ile veri erişim kontrolü\n• Tüm veriler şifreli bağlantılar üzerinden aktarılır',
        },
        {
          title: '5. Veri Silme',
          content: 'Hesabınızı silmek istediğinizde:\n\n• Uygulama içinden çıkış yapabilirsiniz\n• Firebase Console üzerinden hesabınızı silebilirsiniz\n• Yerel veriler uygulama silindiğinde otomatik olarak silinir',
        },
        {
          title: '6. Üçüncü Taraf Servisler',
          content: 'Uygulama aşağıdaki üçüncü taraf servisleri kullanır:\n\n• Firebase (Google): Authentication ve Firestore veritabanı\n• Bu servislerin gizlilik politikaları kendi web sitelerinde mevcuttur',
        },
        {
          title: '7. İletişim',
          content: 'Gizlilik politikası hakkında sorularınız için:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Issues sayfasından bize ulaşabilirsiniz',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: 2025',
      sections: [
        {
          title: '1. Data Collection',
          content: 'ZeitLog collects the following data to record your work check-in/out times:\n\n• Email address (for Firebase Authentication)\n• Check-in/out times and dates\n• Work durations\n• Records stored locally on your device',
        },
        {
          title: '2. Data Usage',
          content: 'Collected data is used only for:\n\n• Providing core app functionality\n• Backing up your data via Firebase\n• Allowing you to access your data on different devices\n\nYour data is never shared with third parties or used for advertising purposes.',
        },
        {
          title: '3. Data Storage',
          content: 'Your data is stored:\n\n• Locally on your device (AsyncStorage)\n• Optionally in Firebase Firestore as cloud backup\n• Your data is only linked to your account and other users cannot access it',
        },
        {
          title: '4. Security',
          content: 'For the security of your data:\n\n• Secure login with Firebase Authentication\n• Data access control with Firestore Security Rules\n• All data is transmitted over encrypted connections',
        },
        {
          title: '5. Data Deletion',
          content: 'When you want to delete your account:\n\n• You can sign out from within the app\n• You can delete your account via Firebase Console\n• Local data is automatically deleted when the app is uninstalled',
        },
        {
          title: '6. Third-Party Services',
          content: 'The app uses the following third-party services:\n\n• Firebase (Google): Authentication and Firestore database\n• Privacy policies for these services are available on their websites',
        },
        {
          title: '7. Contact',
          content: 'For questions about privacy policy:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• You can reach us via the Issues page',
        },
      ],
    },
    de: {
      title: 'Datenschutzerklärung',
      lastUpdated: 'Zuletzt aktualisiert: 2025',
      sections: [
        {
          title: '1. Datenerfassung',
          content: 'ZeitLog erfasst folgende Daten, um Ihre Arbeitszeiten zu erfassen:\n\n• E-Mail-Adresse (für Firebase Authentication)\n• Ein-/Ausstempelzeiten und -daten\n• Arbeitsdauern\n• Lokal auf Ihrem Gerät gespeicherte Einträge',
        },
        {
          title: '2. Datennutzung',
          content: 'Erfasste Daten werden nur verwendet für:\n\n• Bereitstellung der Kernfunktionalität der App\n• Sicherung Ihrer Daten über Firebase\n• Ermöglichen des Zugriffs auf Ihre Daten auf verschiedenen Geräten\n\nIhre Daten werden niemals an Dritte weitergegeben oder für Werbezwecke verwendet.',
        },
        {
          title: '3. Datenspeicherung',
          content: 'Ihre Daten werden gespeichert:\n\n• Lokal auf Ihrem Gerät (AsyncStorage)\n• Optional in Firebase Firestore als Cloud-Backup\n• Ihre Daten sind nur mit Ihrem Konto verknüpft und andere Benutzer können nicht darauf zugreifen',
        },
        {
          title: '4. Sicherheit',
          content: 'Für die Sicherheit Ihrer Daten:\n\n• Sichere Anmeldung mit Firebase Authentication\n• Datenzugriffskontrolle mit Firestore Security Rules\n• Alle Daten werden über verschlüsselte Verbindungen übertragen',
        },
        {
          title: '5. Datenlöschung',
          content: 'Wenn Sie Ihr Konto löschen möchten:\n\n• Sie können sich in der App abmelden\n• Sie können Ihr Konto über die Firebase Console löschen\n• Lokale Daten werden automatisch gelöscht, wenn die App deinstalliert wird',
        },
        {
          title: '6. Drittanbieterdienste',
          content: 'Die App verwendet folgende Drittanbieterdienste:\n\n• Firebase (Google): Authentifizierung und Firestore-Datenbank\n• Datenschutzrichtlinien für diese Dienste sind auf deren Websites verfügbar',
        },
        {
          title: '7. Kontakt',
          content: 'Bei Fragen zur Datenschutzerklärung:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Sie können uns über die Issues-Seite erreichen',
        },
      ],
    },
    fr: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour : 2025',
      sections: [
        {
          title: '1. Collecte de données',
          content: 'ZeitLog collecte les données suivantes pour enregistrer vos heures d\'entrée/sortie de travail :\n\n• Adresse e-mail (pour l\'authentification Firebase)\n• Heures et dates d\'entrée/sortie\n• Durées de travail\n• Enregistrements stockés localement sur votre appareil',
        },
        {
          title: '2. Utilisation des données',
          content: 'Les données collectées sont utilisées uniquement pour :\n\n• Fournir les fonctionnalités de base de l\'application\n• Sauvegarder vos données via Firebase\n• Vous permettre d\'accéder à vos données sur différents appareils\n\nVos données ne sont jamais partagées avec des tiers ni utilisées à des fins publicitaires.',
        },
        {
          title: '3. Stockage des données',
          content: 'Vos données sont stockées :\n\n• Localement sur votre appareil (AsyncStorage)\n• Optionnellement dans Firebase Firestore comme sauvegarde cloud\n• Vos données sont uniquement liées à votre compte et les autres utilisateurs ne peuvent pas y accéder',
        },
        {
          title: '4. Sécurité',
          content: 'Pour la sécurité de vos données :\n\n• Connexion sécurisée avec Firebase Authentication\n• Contrôle d\'accès aux données avec les règles de sécurité Firestore\n• Toutes les données sont transmises via des connexions chiffrées',
        },
        {
          title: '5. Suppression des données',
          content: 'Lorsque vous souhaitez supprimer votre compte :\n\n• Vous pouvez vous déconnecter depuis l\'application\n• Vous pouvez supprimer votre compte via la console Firebase\n• Les données locales sont automatiquement supprimées lorsque l\'application est désinstallée',
        },
        {
          title: '6. Services tiers',
          content: 'L\'application utilise les services tiers suivants :\n\n• Firebase (Google) : Authentification et base de données Firestore\n• Les politiques de confidentialité de ces services sont disponibles sur leurs sites web',
        },
        {
          title: '7. Contact',
          content: 'Pour toute question concernant la politique de confidentialité :\n\n• GitHub : https://github.com/ttimocin/ZeitLog\n• Vous pouvez nous contacter via la page Issues',
        },
      ],
    },
    pt: {
      title: 'Política de Privacidade',
      lastUpdated: 'Última atualização: 2025',
      sections: [
        {
          title: '1. Coleta de Dados',
          content: 'ZeitLog coleta os seguintes dados para registrar seus horários de entrada/saída do trabalho:\n\n• Endereço de e-mail (para autenticação Firebase)\n• Horários e datas de entrada/saída\n• Durações de trabalho\n• Registros armazenados localmente no seu dispositivo',
        },
        {
          title: '2. Uso de Dados',
          content: 'Os dados coletados são usados apenas para:\n\n• Fornecer a funcionalidade principal do aplicativo\n• Fazer backup de seus dados via Firebase\n• Permitir que você acesse seus dados em diferentes dispositivos\n\nSeus dados nunca são compartilhados com terceiros ou usados para fins publicitários.',
        },
        {
          title: '3. Armazenamento de Dados',
          content: 'Seus dados são armazenados:\n\n• Localmente no seu dispositivo (AsyncStorage)\n• Opcionalmente no Firebase Firestore como backup na nuvem\n• Seus dados estão vinculados apenas à sua conta e outros usuários não podem acessá-los',
        },
        {
          title: '4. Segurança',
          content: 'Para a segurança de seus dados:\n\n• Login seguro com Firebase Authentication\n• Controle de acesso a dados com Regras de Segurança Firestore\n• Todos os dados são transmitidos por conexões criptografadas',
        },
        {
          title: '5. Exclusão de Dados',
          content: 'Quando você quiser excluir sua conta:\n\n• Você pode sair de dentro do aplicativo\n• Você pode excluir sua conta via Console Firebase\n• Os dados locais são excluídos automaticamente quando o aplicativo é desinstalado',
        },
        {
          title: '6. Serviços de Terceiros',
          content: 'O aplicativo usa os seguintes serviços de terceiros:\n\n• Firebase (Google): Autenticação e banco de dados Firestore\n• As políticas de privacidade desses serviços estão disponíveis em seus sites',
        },
        {
          title: '7. Contato',
          content: 'Para perguntas sobre a política de privacidade:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Você pode nos contatar através da página Issues',
        },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 2025',
      sections: [
        {
          title: '1. جمع البيانات',
          content: 'يجمع ZeitLog البيانات التالية لتسجيل أوقات تسجيل الدخول/الخروج في العمل:\n\n• عنوان البريد الإلكتروني (لمصادقة Firebase)\n• أوقات وتواريخ تسجيل الدخول/الخروج\n• مدد العمل\n• السجلات المخزنة محليًا على جهازك',
        },
        {
          title: '2. استخدام البيانات',
          content: 'تُستخدم البيانات المجمعة فقط لـ:\n\n• توفير الوظائف الأساسية للتطبيق\n• نسخ بياناتك احتياطيًا عبر Firebase\n• السماح لك بالوصول إلى بياناتك على أجهزة مختلفة\n\nلا تتم مشاركة بياناتك أبدًا مع أطراف ثالثة أو استخدامها لأغراض إعلانية.',
        },
        {
          title: '3. تخزين البيانات',
          content: 'يتم تخزين بياناتك:\n\n• محليًا على جهازك (AsyncStorage)\n• اختياريًا في Firebase Firestore كنسخة احتياطية سحابية\n• بياناتك مرتبطة بحسابك فقط ولا يمكن للمستخدمين الآخرين الوصول إليها',
        },
        {
          title: '4. الأمان',
          content: 'من أجل أمان بياناتك:\n\n• تسجيل دخول آمن باستخدام مصادقة Firebase\n• التحكم في الوصول إلى البيانات باستخدام قواعد أمان Firestore\n• يتم نقل جميع البيانات عبر اتصالات مشفرة',
        },
        {
          title: '5. حذف البيانات',
          content: 'عندما تريد حذف حسابك:\n\n• يمكنك تسجيل الخروج من داخل التطبيق\n• يمكنك حذف حسابك عبر وحدة تحكم Firebase\n• يتم حذف البيانات المحلية تلقائيًا عند إلغاء تثبيت التطبيق',
        },
        {
          title: '6. خدمات الطرف الثالث',
          content: 'يستخدم التطبيق خدمات الطرف الثالث التالية:\n\n• Firebase (Google): المصادقة وقاعدة بيانات Firestore\n• سياسات الخصوصية لهذه الخدمات متاحة على مواقعهم الإلكترونية',
        },
        {
          title: '7. الاتصال',
          content: 'للأسئلة حول سياسة الخصوصية:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• يمكنك الوصول إلينا عبر صفحة المشكلات (Issues)',
        },
      ],
    },
    zh: {
      title: '隐私政策',
      lastUpdated: '最后更新：2025',
      sections: [
        {
          title: '1. 数据收集',
          content: 'ZeitLog 收集以下数据以记录您的工作签入/签出时间：\n\n• 电子邮件地址（用于 Firebase 身份验证）\n• 签入/签出时间和日期\n• 工作时长\n• 本地存储在您设备上的记录',
        },
        {
          title: '2. 数据使用',
          content: '收集的数据仅用于：\n\n• 提供核心应用程序功能\n• 通过 Firebase 备份您的数据\n• 允许您在不同设备上访问您的数据\n\n您的数据绝不会与第三方共享或用于广告目的。',
        },
        {
          title: '3. 数据存储',
          content: '您的数据存储在：\n\n• 本地设备上 (AsyncStorage)\n• 可选地存储在 Firebase Firestore 中作为云备份\n• 您的数据仅链接到您的帐户，其他用户无法访问',
        },
        {
          title: '4. 安全性',
          content: '为了您的数据安全：\n\n• 使用 Firebase 身份验证进行安全登录\n• 使用 Firestore 安全规则进行数据访问控制\n• 所有数据均通过加密连接传输',
        },
        {
          title: '5. 数据删除',
          content: '当您想要删除您的帐户时：\n\n• 您可以在应用程序内注销\n• 您可以通过 Firebase 控制台删除您的帐户\n• 卸载应用程序时，本地数据将被自动删除',
        },
        {
          title: '6. 第三方服务',
          content: '本应用程序使用以下第三方服务：\n\n• Firebase (Google)：身份验证和 Firestore 数据库\n• 这些服务的隐私政策可在其网站上找到',
        },
        {
          title: '7. 联系方式',
          content: '有关隐私政策的问题：\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• 您可以通过 Issues 页面联系我们',
        },
      ],
    },
    ru: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: 2025',
      sections: [
        {
          title: '1. Сбор данных',
          content: 'ZeitLog собирает следующие данные для записи времени вашего прихода/ухода с работы:\n\n• Адрес электронной почты (для аутентификации Firebase)\n• Время и даты прихода/ухода\n• Продолжительность работы\n• Записи, хранящиеся локально на вашем устройстве',
        },
        {
          title: '2. Использование данных',
          content: 'Собранные данные используются только для:\n\n• Обеспечения основной функциональности приложения\n• Резервного копирования ваших данных через Firebase\n• Предоставления доступа к вашим данным на разных устройствах\n\nВаши данные никогда не передаются третьим лицам и не используются в рекламных целях.',
        },
        {
          title: '3. Хранение данных',
          content: 'Ваши данные хранятся:\n\n• Локально на вашем устройстве (AsyncStorage)\n• Опционально в Firebase Firestore в качестве облачной резервной копии\n• Ваши данные связаны только с вашей учетной записью, и другие пользователи не могут получить к ним доступ',
        },
        {
          title: '4. Безопасность',
          content: 'Для безопасности ваших данных:\n\n• Безопасный вход с помощью аутентификации Firebase\n• Контроль доступа к данным с помощью правил безопасности Firestore\n• Все данные передаются по зашифрованным соединениям',
        },
        {
          title: '5. Удаление данных',
          content: 'Когда вы хотите удалить свою учетную запись:\n\n• Вы можете выйти из приложения\n• Вы можете удалить свою учетную запись через консоль Firebase\n• Локальные данные автоматически удаляются при удалении приложения',
        },
        {
          title: '6. Сторонние сервисы',
          content: 'Приложение использует следующие сторонние сервисы:\n\n• Firebase (Google): Аутентификация и база данных Firestore\n• Политики конфиденциальности этих сервисов доступны на их веб-сайтах',
        },
        {
          title: '7. Контакт',
          content: 'По вопросам политики конфиденциальности:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Вы можете связаться с нами через страницу Issues',
        },
      ],
    },
    uk: {
      title: 'Політика конфіденційності',
      lastUpdated: 'Останнє оновлення: 2025',
      sections: [
        {
          title: '1. Збір даних',
          content: 'ZeitLog збирає наступні дані для запису часу вашого приходу/виходу з роботи:\n\n• Адреса електронної пошти (для аутентифікації Firebase)\n• Час і дати приходу/виходу\n• Тривалість роботи\n• Записи, що зберігаються локально на вашому пристрої',
        },
        {
          title: '2. Використання даних',
          content: 'Зібрані дані використовуються тільки для:\n\n• Забезпечення основної функціональності додатку\n• Резервного копіювання ваших даних через Firebase\n• Надання доступу до ваших даних на різних пристроях\n\nВаші дані ніколи не передаються третім особам і не використовуються в рекламних цілях.',
        },
        {
          title: '3. Зберігання даних',
          content: 'Ваші дані зберігаються:\n\n• Локально на вашому пристрої (AsyncStorage)\n• Опціонально в Firebase Firestore як хмарна резервна копія\n• Ваші дані пов\'язані лише з вашим обліковим записом, і інші користувачі не можуть отримати до них доступ',
        },
        {
          title: '4. Безпека',
          content: 'Для безпеки ваших даних:\n\n• Безпечний вхід за допомогою аутентифікації Firebase\n• Контроль доступу до даних за допомогою правил безпеки Firestore\n• Всі дані передаються через зашифровані з\'єднання',
        },
        {
          title: '5. Видалення даних',
          content: 'Коли ви хочете видалити свій обліковий запис:\n\n• Ви можете вийти з додатку\n• Ви можете видалити свій обліковий запис через консоль Firebase\n• Локальні дані автоматично видаляються при видаленні додатку',
        },
        {
          title: '6. Сторонні сервіси',
          content: 'Додаток використовує наступні сторонні сервіси:\n\n• Firebase (Google): Аутентифікація та база даних Firestore\n• Політики конфіденційності цих сервісів доступні на їх веб-сайтах',
        },
        {
          title: '7. Контакт',
          content: 'З питань політики конфіденційності:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Ви можете зв\'язатися з нами через сторінку Issues',
        },
      ],
    },
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentContent.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <Text style={styles.lastUpdated}>{currentContent.lastUpdated}</Text>

        {currentContent.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    lastUpdated: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginBottom: 24,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      marginBottom: 12,
    },
    sectionContent: {
      fontSize: 14,
      lineHeight: 22,
      color: isDark ? '#ccc' : '#666',
    },
  });

