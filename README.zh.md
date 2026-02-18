# ⏱️ ZeitLog - 工作时间追踪应用

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**免费 • 无广告 • 开源**

一键记录您的工作时间，备份到 Firebase 并导出为 CSV。

**🌐 Languages / Sprachen:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md) • [🇫🇷 Français](README.fr.md) • [🇵🇹 Português](README.pt.md) • [🇸🇦 العربية](README.ar.md) • [🇨🇳 中文](README.zh.md) • [🇷🇺 Русский](README.ru.md)

[功能](#-功能) • [安装](#-安装) • [使用](#-使用) • [贡献](#-贡献) • [许可证](#-许可证)

</div>

---

## 📖 关于

ZeitLog 是一款**完全免费且无广告**的移动应用程序，可轻松追踪您的工作时间。凭借其现代且用户友好的界面，追踪您的工作时间从未如此简单。

### 🎯 为什么选择 ZeitLog？

- ✅ **完全免费** - 无费用、订阅或隐藏成本
- ✅ **无广告** - 无广告或未经请求的通知
- ✅ **开源** - 代码完全开放、安全且透明
- ✅ **注重隐私** - 您的数据保留在您的账户中，从不共享
- ✅ **离线工作** - 即使没有网络也能记录条目
- ✅ **Firebase 备份** - 您的数据安全存储在云端
- ✅ **CSV 导出** - 在 Excel 中打开您的记录

---

## ✨ 功能

### 🎨 用户体验
- **一键记录**：大而易于访问的按钮，可立即签到/签退
- **实时时钟显示**：实时时钟和日期信息
- **工作时长追踪**：签到后实时显示工作时长
- **深色模式**：系统主题兼容，护眼设计
- **多语言支持**：土耳其语、英语、德语、法语、葡萄牙语、阿拉伯语、中文、俄语
- **休息游戏**：集成小游戏（数独、2048 等），在休息期间缓解压力

### 💾 数据管理
- **自动备份**：您的记录会自动备份到 Firebase
- **离线操作**：无需网络即可记录条目，稍后同步
- **CSV 导出**：以 CSV 格式下载并分享您的所有记录
- **CSV 导入**：从 CSV 加载现有记录
- **每日摘要**：每天的进入、退出和工作时长摘要

### 📊 报告
- **每周视图**：每周工作时间和加班追踪
- **每日详情**：每天的详细进入/退出信息
- **灵活工作日**：自定义您的工作日（周一至周日）
- **假期标记**：标记假期并自动记录 7 小时
- **加班/缺勤计算**：每日和每周加班/缺勤计算

### 🔔 通知和更新
- **签到通知**：签到时即逝通知
- **提醒**：6.5 和 7 小时后自动提醒通知
- **签退通知**：签退时摘要通知
- **自动更新检查**：应用启动时检查新版本

### 🔐 安全
- **Firebase 认证**：支持电子邮件/密码和 Google 登录
- **账户删除**：永久删除您的账户和所有数据的选项
- **安全 Firestore 规则**：用户只能访问自己的数据
- **数据验证**：所有数据通过格式验证

---

## 🚀 安装

### 要求

- Node.js 18+ 
- npm 或 yarn
- Expo CLI
- Android Studio（用于 Android）或 Xcode（用于 iOS）

### 步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/ttimocin/ZeitLog.git
   cd ZeitLog
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **Firebase 配置**
   
   a. 前往 [Firebase Console](https://console.firebase.google.com/)
   
   b. 创建一个新项目
   
   c. 添加 "Web app" 并获取配置信息
   
   d. 创建 Firestore Database（您可以从测试模式开始）
   
   e. 启用认证（电子邮件/密码和 Google）
   
   f. 更新 `config/firebase.ts` 中的配置：
   
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
   
   g. 前往 Firebase Console 中的 Firestore Rules 选项卡并粘贴 `firestore.rules` 中的规则

4. **Google 登录配置（可选）**
   
   从 Firebase Console 下载 `google-services.json` 并将其添加到 Android 项目根目录。

5. **启动应用程序**
   ```bash
   # 开发服务器
   npm start
   
   # 用于 Android
   npm run android
   
   # 用于 iOS
   npm run ios
   ```

---

## 📱 使用

### 主屏幕（记录）

- **绿色按钮（签到）**：记录您的工作开始时间
- **橙色按钮（签退）**：记录您的工作结束时间
- **实时计时器**：签到后实时显示您的工作时长
- **今日记录**：列出您今天所做的所有记录
  - ☁️ = 已备份到 Firebase
  - 📱 = 仅本地记录（尚未同步）

### 历史屏幕

- **每周视图**：表格格式的每周工作时间
- **每日详情**：每天的进入/退出时间和工作时长
- **加班/缺勤**：每日和每周加班/缺勤显示
- **假期**：点击日期以添加或删除假期

### 设置

- **语言选择**：土耳其语、英语、德语、法语、葡萄牙语等
- **主题**：系统、浅色、深色
- **Firebase 同步**：
  - 备份到云端：将待处理记录上传到 Firebase
  - 从云端加载：将记录从 Firebase 下载到本地设备
- **CSV 操作**：
  - 下载 CSV：以 CSV 文件形式分享所有记录
  - 导入 CSV：从 CSV 文件加载记录

---

## 🛠️ 技术

- **React Native** (Expo) - 跨平台移动开发
- **TypeScript** - 类型安全
- **Firebase** - 认证和 Firestore
- **Expo Router** - 基于文件的路由
- **AsyncStorage** - 本地数据存储
- **Expo Notifications** - 通知管理
- **Expo File System & Sharing** - CSV 导出/导入

---

## 📁 项目结构

```
ZeitLog/
├── app/                      # Expo Router 页面
│   ├── (tabs)/              # 标签导航
│   │   ├── index.tsx        # 主记录屏幕
│   │   └── explore.tsx      # 历史屏幕
│   ├── login.tsx            # 登录屏幕
│   ├── settings.tsx         # 设置屏幕
│   └── _layout.tsx         # 根布局
├── components/              # 可重用组件
├── config/                 # 配置文件
├── context/                # React 上下文
├── services/               # 服务层
├── types/                  # TypeScript 类型
├── utils/                  # 辅助函数
├── i18n/                   # 多语言支持
├── firestore.rules         # Firestore 安全规则
└── app.json                # Expo 配置
```

---

## 🔒 安全

- **Firestore 安全规则**：用户只能访问自己的数据
- **认证**：使用 Firebase Authentication 安全登录
- **数据验证**：所有数据通过格式验证
- **隐私**：不与第三方共享任何数据

---

## 📦 构建 APK

### 使用 EAS Build（推荐）

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
```

### 本地构建

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

---

## 🤝 贡献

我们欢迎您的贡献！请按照以下步骤操作：

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## 📄 许可证

本项目根据 [MIT 许可证](LICENSE) 授权。

---

## 👨‍💻 开发者

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

<div align="center">

**使用 ZeitLog 轻松追踪您的工作时间！** ⏱️

Made with ❤️ by TayTek

</div>
