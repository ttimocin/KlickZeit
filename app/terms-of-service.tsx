import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function TermsOfServiceScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const styles = createStyles(isDark);

  const content = {
    tr: {
      title: 'Kullanım Koşulları',
      lastUpdated: 'Son Güncelleme: 2025',
      sections: [
        {
          title: '1. Kabul',
          content: 'ZeitLog uygulamasını kullanarak, bu Kullanım Koşullarını kabul etmiş sayılırsınız. Uygulamayı kullanmaya devam ederseniz, bu koşullara bağlı kalmayı kabul edersiniz.',
        },
        {
          title: '2. Hizmet Açıklaması',
          content: 'ZeitLog, işe giriş-çıkış saatlerinizi kaydetmenizi sağlayan ücretsiz bir mobil uygulamadır. Uygulama:\n\n• Giriş/çıkış saatlerinizi kaydetmenize olanak tanır\n• Verilerinizi Firebase üzerinden yedeklemenize izin verir\n• CSV formatında veri dışa aktarma özelliği sunar\n• Tamamen ücretsiz ve reklamsızdır',
        },
        {
          title: '3. Kullanıcı Sorumlulukları',
          content: 'Uygulamayı kullanırken:\n\n• Hesap bilgilerinizi güvende tutmak sizin sorumluluğunuzdadır\n• Verilerinizi doğruluğundan siz sorumlusunuz\n• Uygulamayı yasalara aykırı amaçlarla kullanamazsınız\n• Başkalarının hesaplarına erişmeye çalışamazsınız',
        },
        {
          title: '4. Hizmet Kullanılabilirliği',
          content: 'ZeitLog, hizmeti kesintisiz sağlamaya çalışır ancak:\n\n• Zaman zaman bakım veya güncellemeler nedeniyle hizmet kesintileri olabilir\n• İnternet bağlantısı gerektiren özellikler (Firebase senkronizasyonu) bağlantı durumuna bağlıdır\n• Uygulama çevrimdışı modda da çalışabilir',
        },
        {
          title: '5. Fikri Mülkiyet',
          content: 'ZeitLog ve tüm içeriği, telif hakkı ve diğer fikri mülkiyet yasalarıyla korunmaktadır. Uygulama MIT Lisansı altında açık kaynaklıdır.',
        },
        {
          title: '6. Sorumluluk Reddi',
          content: 'ZeitLog:\n\n• Verilerinizin kaybolmasından sorumlu tutulamaz\n• Uygulama kullanımından kaynaklanan herhangi bir zarardan sorumlu değildir\n• "OLDUĞU GİBİ" sağlanır, garanti verilmez',
        },
        {
          title: '7. Değişiklikler',
          content: 'Bu Kullanım Koşulları zaman zaman güncellenebilir. Önemli değişiklikler kullanıcılara bildirilecektir. Değişikliklerden sonra uygulamayı kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.',
        },
        {
          title: '8. İletişim',
          content: 'Sorularınız veya önerileriniz için:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Issues sayfasından bize ulaşabilirsiniz',
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: 2025',
      sections: [
        {
          title: '1. Acceptance',
          content: 'By using the ZeitLog application, you agree to these Terms of Service. If you continue to use the app, you agree to be bound by these terms.',
        },
        {
          title: '2. Service Description',
          content: 'ZeitLog is a free mobile application that allows you to record your work check-in/out times. The app:\n\n• Allows you to record your check-in/out times\n• Allows you to backup your data via Firebase\n• Provides CSV data export functionality\n• Is completely free and ad-free',
        },
        {
          title: '3. User Responsibilities',
          content: 'When using the app:\n\n• You are responsible for keeping your account information secure\n• You are responsible for the accuracy of your data\n• You may not use the app for illegal purposes\n• You may not attempt to access others\' accounts',
        },
        {
          title: '4. Service Availability',
          content: 'ZeitLog strives to provide uninterrupted service, but:\n\n• Service interruptions may occur due to maintenance or updates\n• Features requiring internet connection (Firebase sync) depend on connection status\n• The app can also work in offline mode',
        },
        {
          title: '5. Intellectual Property',
          content: 'ZeitLog and all its content are protected by copyright and other intellectual property laws. The app is open source under the MIT License.',
        },
        {
          title: '6. Disclaimer',
          content: 'ZeitLog:\n\n• Cannot be held responsible for loss of your data\n• Is not liable for any damages arising from app usage\n• Is provided "AS IS" without warranty',
        },
        {
          title: '7. Changes',
          content: 'These Terms of Service may be updated from time to time. Significant changes will be notified to users. Continued use of the app after changes means you accept the updated terms.',
        },
        {
          title: '8. Contact',
          content: 'For questions or suggestions:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• You can reach us via the Issues page',
        },
      ],
    },
    de: {
      title: 'Nutzungsbedingungen',
      lastUpdated: 'Zuletzt aktualisiert: 2025',
      sections: [
        {
          title: '1. Annahme',
          content: 'Durch die Nutzung der ZeitLog-Anwendung stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie die App weiterhin nutzen, stimmen Sie zu, an diese Bedingungen gebunden zu sein.',
        },
        {
          title: '2. Dienstbeschreibung',
          content: 'ZeitLog ist eine kostenlose mobile Anwendung, mit der Sie Ihre Arbeitszeiten erfassen können. Die App:\n\n• Ermöglicht die Erfassung Ihrer Ein-/Ausstempelzeiten\n• Ermöglicht die Sicherung Ihrer Daten über Firebase\n• Bietet CSV-Datenexport-Funktionalität\n• Ist vollständig kostenlos und werbefrei',
        },
        {
          title: '3. Benutzerverantwortlichkeiten',
          content: 'Bei der Nutzung der App:\n\n• Sie sind dafür verantwortlich, Ihre Kontoinformationen sicher zu halten\n• Sie sind für die Richtigkeit Ihrer Daten verantwortlich\n• Sie dürfen die App nicht für illegale Zwecke verwenden\n• Sie dürfen nicht versuchen, auf andere Konten zuzugreifen',
        },
        {
          title: '4. Dienstverfügbarkeit',
          content: 'ZeitLog bemüht sich, einen unterbrechungsfreien Service zu bieten, aber:\n\n• Dienstunterbrechungen können aufgrund von Wartung oder Updates auftreten\n• Funktionen, die eine Internetverbindung erfordern (Firebase-Sync), hängen vom Verbindungsstatus ab\n• Die App kann auch im Offline-Modus arbeiten',
        },
        {
          title: '5. Geistiges Eigentum',
          content: 'ZeitLog und alle seine Inhalte sind durch Urheberrechte und andere Gesetze zum geistigen Eigentum geschützt. Die App ist unter der MIT-Lizenz Open Source.',
        },
        {
          title: '6. Haftungsausschluss',
          content: 'ZeitLog:\n\n• Kann nicht für den Verlust Ihrer Daten verantwortlich gemacht werden\n• Ist nicht haftbar für Schäden, die aus der App-Nutzung entstehen\n• Wird "WIE BESEHEN" ohne Gewährleistung bereitgestellt',
        },
        {
          title: '7. Änderungen',
          content: 'Diese Nutzungsbedingungen können von Zeit zu Zeit aktualisiert werden. Wesentliche Änderungen werden den Benutzern mitgeteilt. Die fortgesetzte Nutzung der App nach Änderungen bedeutet, dass Sie die aktualisierten Bedingungen akzeptieren.',
        },
        {
          title: '8. Kontakt',
          content: 'Bei Fragen oder Vorschlägen:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Sie können uns über die Issues-Seite erreichen',
        },
      ],
    },
    fr: {
      title: 'Conditions d\'utilisation',
      lastUpdated: 'Dernière mise à jour : 2025',
      sections: [
        {
          title: '1. Acceptation',
          content: 'En utilisant l\'application ZeitLog, vous acceptez ces Conditions d\'utilisation. Si vous continuez à utiliser l\'application, vous acceptez d\'être lié par ces conditions.',
        },
        {
          title: '2. Description du service',
          content: 'ZeitLog est une application mobile gratuite qui vous permet d\'enregistrer vos heures d\'entrée/sortie de travail. L\'application :\n\n• Vous permet d\'enregistrer vos heures d\'entrée/sortie\n• Vous permet de sauvegarder vos données via Firebase\n• Fournit une fonctionnalité d\'exportation de données CSV\n• Est entièrement gratuite et sans publicité',
        },
        {
          title: '3. Responsabilités de l\'utilisateur',
          content: 'Lorsque vous utilisez l\'application :\n\n• Vous êtes responsable de la sécurité de vos informations de compte\n• Vous êtes responsable de l\'exactitude de vos données\n• Vous ne pouvez pas utiliser l\'application à des fins illégales\n• Vous ne pouvez pas tenter d\'accéder aux comptes d\'autrui',
        },
        {
          title: '4. Disponibilité du service',
          content: 'ZeitLog s\'efforce de fournir un service ininterrompu, mais :\n\n• Des interruptions de service peuvent survenir en raison de maintenance ou de mises à jour\n• Les fonctionnalités nécessitant une connexion Internet (synchronisation Firebase) dépendent de l\'état de la connexion\n• L\'application peut également fonctionner en mode hors ligne',
        },
        {
          title: '5. Propriété intellectuelle',
          content: 'ZeitLog et tout son contenu sont protégés par le droit d\'auteur et d\'autres lois sur la propriété intellectuelle. L\'application est open source sous licence MIT.',
        },
        {
          title: '6. Avis de non-responsabilité',
          content: 'ZeitLog :\n\n• Ne peut être tenu responsable de la perte de vos données\n• N\'est pas responsable des dommages résultant de l\'utilisation de l\'application\n• Est fourni "TEL QUEL" sans garantie',
        },
        {
          title: '7. Modifications',
          content: 'Ces Conditions d\'utilisation peuvent être mises à jour de temps à autre. Les modifications importantes seront notifiées aux utilisateurs. L\'utilisation continue de l\'application après les modifications signifie que vous acceptez les conditions mises à jour.',
        },
        {
          title: '8. Contact',
          content: 'Pour des questions ou des suggestions :\n\n• GitHub : https://github.com/ttimocin/ZeitLog\n• Vous pouvez nous contacter via la page Issues',
        },
      ],
    },
    pt: {
      title: 'Termos de Serviço',
      lastUpdated: 'Última atualização: 2025',
      sections: [
        {
          title: '1. Aceitação',
          content: 'Ao usar o aplicativo ZeitLog, você concorda com estes Termos de Serviço. Se você continuar a usar o aplicativo, você concorda em ficar vinculado a estes termos.',
        },
        {
          title: '2. Descrição do Serviço',
          content: 'ZeitLog é um aplicativo móvel gratuito que permite registrar seus horários de entrada/saída do trabalho. O aplicativo:\n\n• Permite registrar seus horários de entrada/saída\n• Permite fazer backup de seus dados via Firebase\n• Fornece funcionalidade de exportação de dados CSV\n• É totalmente gratuito e sem anúncios',
        },
        {
          title: '3. Responsabilidades do Usuário',
          content: 'Ao usar o aplicativo:\n\n• Você é responsável por manter as informações da sua conta seguras\n• Você é responsável pela precisão dos seus dados\n• Você não pode usar o aplicativo para fins ilegais\n• Você não pode tentar acessar contas de outras pessoas',
        },
        {
          title: '4. Disponibilidade do Serviço',
          content: 'ZeitLog se esforça para fornecer um serviço ininterrupto, mas:\n\n• Interrupções de serviço podem ocorrer devido a manutenção ou atualizações\n• Recursos que requerem conexão com a internet (sincronização Firebase) dependem do status da conexão\n• O aplicativo também pode funcionar no modo offline',
        },
        {
          title: '5. Propriedade Intelectual',
          content: 'ZeitLog e todo o seu conteúdo são protegidos por direitos autorais e outras leis de propriedade intelectual. O aplicativo é de código aberto sob a Licença MIT.',
        },
        {
          title: '6. Isenção de Responsabilidade',
          content: 'ZeitLog:\n\n• Não pode ser responsabilizado pela perda de seus dados\n• Não é responsável por quaisquer danos decorrentes do uso do aplicativo\n• É fornecido "COMO ESTÁ" sem garantia',
        },
        {
          title: '7. Alterações',
          content: 'Estes Termos de Serviço podem ser atualizados de tempos em tempos. Alterações significativas serão notificadas aos usuários. O uso contínuo do aplicativo após as alterações significa que você aceita os termos atualizados.',
        },
        {
          title: '8. Contato',
          content: 'Para perguntas ou sugestões:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Você pode nos contatar através da página Issues',
        },
      ],
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdated: 'آخر تحديث: 2025',
      sections: [
        {
          title: '1. القبول',
          content: 'باستخدام تطبيق ZeitLog، فإنك توافق على شروط الخدمة هذه. إذا واصلت استخدام التطبيق، فإنك توافق على الالتزام بهذه الشروط.',
        },
        {
          title: '2. وصف الخدمة',
          content: 'تطبيق ZeitLog هو تطبيق محمول مجاني يسمح لك بتسجيل أوقات الدخول/الخروج في العمل. يوفر التطبيق:\n\n• إمكانية تسجيل أوقات الدخول/الخروج\n• إمكانية نسخ بياناتك احتياطيًا عبر Firebase\n• خاصية تصدير البيانات بتنسيق CSV\n• مجاني تمامًا وخالي من الإعلانات',
        },
        {
          title: '3. مسؤوليات المستخدم',
          content: 'عند استخدام التطبيق:\n\n• أنت مسؤول عن الحفاظ على أمان معلومات حسابك\n• أنت مسؤول عن دقة بياناتك\n• لا يجوز لك استخدام التطبيق لأغراض غير قانونية\n• لا يجوز لك محاولة الوصول إلى حسابات الآخرين',
        },
        {
          title: '4. توفر الخدمة',
          content: 'يسعى ZeitLog لتقديم خدمة دون انقطاع، ولكن:\n\n• قد تحدث انقطاعات في الخدمة بسبب الصيانة أو التحديثات\n• الميزات التي تتطلب اتصالاً بالإنترنت (مزامنة Firebase) تعتمد على حالة الاتصال\n• يمكن للتطبيق العمل أيضًا في وضع عدم الاتصال',
        },
        {
          title: '5. الملكية الفكرية',
          content: 'ZeitLog وجميع محتوياته محمية بموجب قوانين حقوق الطبع والنشر وقوانين الملكية الفكرية الأخرى. التطبيق مفتوح المصدر بموجب ترخيص MIT.',
        },
        {
          title: '6. إخلاء المسؤولية',
          content: 'ZeitLog:\n\n• لا يمكن أن يكون مسؤولاً عن فقدان بياناتك\n• غير مسؤول عن أي أضرار ناجمة عن استخدام التطبيق\n• يتم تقديمه "كما هو" دون ضمان',
        },
        {
          title: '7. التغييرات',
          content: 'قد يتم تحديث شروط الخدمة هذه من وقت لآخر. سيتم إخطار المستخدمين بالتغييرات الهامة. الاستخدام المستمر للتطبيق بعد التغييرات يعني أنك تقبل الشروط المحدثة.',
        },
        {
          title: '8. الاتصال',
          content: 'للأسئلة أو الاقتراحات:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• يمكنك الوصول إلينا عبر صفحة المشكلات (Issues)',
        },
      ],
    },
    zh: {
      title: '服务条款',
      lastUpdated: '最后更新：2025',
      sections: [
        {
          title: '1. 接受',
          content: '使用 ZeitLog 应用程序即表示您同意这些服务条款。如果您继续使用该应用程序，即表示您同意受这些条款的约束。',
        },
        {
          title: '2. 服务说明',
          content: 'ZeitLog 是一款免费的移动应用程序，允许您记录工作签入/签出时间。该应用程序：\n\n• 允许您记录签入/签出时间\n• 允许您通过 Firebase 备份数据\n• 提供 CSV 数据导出功能\n• 完全免费且无广告',
        },
        {
          title: '3. 用户责任',
          content: '使用应用程序时：\n\n• 您有责任确保您的帐户信息安全\n• 您对数据的准确性负责\n• 您不得将应用程序用于非法目的\n• 您不得尝试访问他人的帐户',
        },
        {
          title: '4. 服务可用性',
          content: 'ZeitLog 致力于提供不间断的服务，但是：\n\n• 由于维护或更新，可能会出现服务中断\n• 需要互联网连接的功能（Firebase 同步）取决于连接状态\n• 该应用程序也可以在离线模式下工作',
        },
        {
          title: '5. 知识产权',
          content: 'ZeitLog 及其所有内容受版权和其他知识产权法律保护。该应用程序是在 MIT 许可下开源的。',
        },
        {
          title: '6. 免责声明',
          content: 'ZeitLog：\n\n• 不对您的数据丢失负责\n• 不对因使用应用程序而造成的任何损害负责\n• “按原样”提供，不提供担保',
        },
        {
          title: '7. 变更',
          content: '这些服务条款可能会不时更新。重大变更将通知用户。变更后继续使用应用程序意味着您接受更新后的条款。',
        },
        {
          title: '8. 联系方式',
          content: '如有疑问或建议：\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• 您可以通过 Issues 页面联系我们',
        },
      ],
    },
    ru: {
      title: 'Условия использования',
      lastUpdated: 'Последнее обновление: 2025',
      sections: [
        {
          title: '1. Принятие',
          content: 'Используя приложение ZeitLog, вы соглашаетесь с этими Условиями использования. Если вы продолжаете использовать приложение, вы соглашаетесь соблюдать эти условия.',
        },
        {
          title: '2. Описание услуги',
          content: 'ZeitLog — это бесплатное мобильное приложение, которое позволяет записывать время прихода/ухода с работы. Приложение:\n\n• Позволяет записывать время прихода/ухода\n• Позволяет создавать резервные копии данных через Firebase\n• Предоставляет функцию экспорта данных в CSV\n• Полностью бесплатно и без рекламы',
        },
        {
          title: '3. Обязанности пользователя',
          content: 'При использовании приложения:\n\n• Вы несете ответственность за безопасность информации вашей учетной записи\n• Вы несете ответственность за точность ваших данных\n• Вы не можете использовать приложение в незаконных целях\n• Вы не можете пытаться получить доступ к чужим учетным записям',
        },
        {
          title: '4. Доступность услуги',
          content: 'ZeitLog стремится предоставлять бесперебойное обслуживание, но:\n\n• Перерывы в обслуживании могут возникать из-за технического обслуживания или обновлений\n• Функции, требующие подключения к Интернету (синхронизация Firebase), зависят от состояния подключения\n• Приложение также может работать в автономном режиме',
        },
        {
          title: '5. Интеллектуальная собственность',
          content: 'ZeitLog и весь его контент защищены авторским правом и другими законами об интеллектуальной собственности. Приложение с открытым исходным кодом под лицензией MIT.',
        },
        {
          title: '6. Отказ от ответственности',
          content: 'ZeitLog:\n\n• Не несет ответственности за потерю ваших данных\n• Не несет ответственности за любой ущерб, возникший в результате использования приложения\n• Предоставляется «КАК ЕСТЬ» без гарантии',
        },
        {
          title: '7. Изменения',
          content: 'Эти Условия использования могут время от времени обновляться. О существенных изменениях пользователи будут уведомлены. Продолжение использования приложения после изменений означает, что вы принимаете обновленные условия.',
        },
        {
          title: '8. Контакт',
          content: 'По вопросам или предложениям:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Вы можете связаться с нами через страницу Issues',
        },
      ],
    },
    uk: {
      title: 'Умови використання',
      lastUpdated: 'Останнє оновлення: 2025',
      sections: [
        {
          title: '1. Прийняття',
          content: 'Використовуючи додаток ZeitLog, ви погоджуєтесь з цими Умовами використання. Якщо ви продовжуєте використовувати додаток, ви погоджуєтесь дотримуватися цих умов.',
        },
        {
          title: '2. Опис послуги',
          content: 'ZeitLog — це безкоштовний мобільний додаток, який дозволяє записувати час вашого приходу/виходу з роботи. Додаток:\n\n• Дозволяє записувати час приходу/виходу\n• Дозволяє створювати резервні копії ваших даних через Firebase\n• Надає функцію експорту даних у CSV\n• Повністю безкоштовний і без реклами',
        },
        {
          title: '3. Обов\'язки користувача',
          content: 'При використанні додатку:\n\n• Ви несете відповідальність за безпеку інформації вашого облікового запису\n• Ви несете відповідальність за точність ваших даних\n• Ви не можете використовувати додаток у незаконних цілях\n• Ви не можете намагатися отримати доступ до чужих облікових записів',
        },
        {
          title: '4. Доступність послуги',
          content: 'ZeitLog прагне надавати безперебійне обслуговування, але:\n\n• Перерви в обслуговуванні можуть виникати через технічне обслуговування або оновлення\n• Функції, що вимагають підключення до Інтернету (синхронізація Firebase), залежать від стану підключення\n• Додаток також може працювати в автономному режимі',
        },
        {
          title: '5. Інтелектуальна власність',
          content: 'ZeitLog і весь його контент захищені авторським правом та іншими законами про інтелектуальну власність. Додаток є відкритим кодом під ліцензією MIT.',
        },
        {
          title: '6. Відмова від відповідальності',
          content: 'ZeitLog:\n\n• Не несе відповідальності за втрату ваших даних\n• Не несе відповідальності за будь-які збитки, що виникли внаслідок використання додатку\n• Надається «ЯК Є» без гарантії',
        },
        {
          title: '7. Зміни',
          content: 'Ці Умови використання можуть час від часу оновлюватися. Про суттєві зміни користувачі будуть повідомлені. Продовження використання додатку після змін означає, що ви приймаєте оновлені умови.',
        },
        {
          title: '8. Контакт',
          content: 'З питань або пропозицій:\n\n• GitHub: https://github.com/ttimocin/ZeitLog\n• Ви можете зв\'язатися з нами через сторінку Issues',
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

