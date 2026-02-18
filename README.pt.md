# ⏱️ ZeitLog - Aplicativo de Rastreamento de Tempo de Trabalho

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Gratuito • Sem Anúncios • Código Aberto**

Registre suas horas de trabalho com um toque, faça backup no Firebase e exporte como CSV.

**🌐 Languages / Sprachen:** [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README.en.md) • [🇩🇪 Deutsch](README.de.md) • [🇫🇷 Français](README.fr.md) • [🇵🇹 Português](README.pt.md) • [🇸🇦 العربية](README.ar.md) • [🇨🇳 中文](README.zh.md) • [🇷🇺 Русский](README.ru.md)

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-uso) • [Contribuição](#-contribuição) • [Licença](#-licença)

</div>

---

## 📖 Sobre

ZeitLog é um aplicativo móvel **totalmente gratuito e sem anúncios** que facilita o rastreamento de suas horas de trabalho. Com sua interface moderna e fácil de usar, rastrear suas horas de trabalho nunca foi tão fácil.

### 🎯 Por que ZeitLog?

- ✅ **Totalmente Gratuito** - Sem taxas, assinaturas ou custos ocultos
- ✅ **Sem Anúncios** - Sem anúncios ou notificações não solicitadas
- ✅ **Código Aberto** - O código é totalmente aberto, seguro e transparente
- ✅ **Focado na Privacidade** - Seus dados permanecem na sua conta, nunca compartilhados
- ✅ **Funciona Offline** - Registre entradas mesmo sem internet
- ✅ **Backup no Firebase** - Seus dados são armazenados com segurança na nuvem
- ✅ **Exportação CSV** - Abra seus registros no Excel

---

## ✨ Funcionalidades

### 🎨 Experiência do Usuário
- **Registro com Um Toque**: Botão grande e acessível para entrada/saída instantânea
- **Relógio ao Vivo**: Informações de hora e data em tempo real
- **Rastreamento de Duração do Trabalho**: Exibição da duração do trabalho ao vivo após a entrada
- **Modo Escuro**: Design compatível com o tema do sistema, amigável aos olhos
- **Suporte Multi-idioma**: Turco, Inglês, Alemão, Francês, Português, Árabe, Chinês, Russo
- **Jogo de Pausa**: Minijogo integrado (Sudoku, 2048 etc.) para aliviar o estresse durante as pausas

### 💾 Gerenciamento de Dados
- **Backup Automático**: Seus registros são salvos automaticamente no Firebase
- **Operação Offline**: Registre entradas sem internet, sincronize depois
- **Exportação CSV**: Baixe e compartilhe todos os seus registros em formato CSV
- **Importação CSV**: Carregue registros existentes de CSV
- **Resumo Diário**: Resumo de entrada, saída e duração do trabalho para cada dia

### 📊 Relatórios
- **Visualização Semanal**: Horas de trabalho semanais e rastreamento de horas extras
- **Detalhes Diários**: Informações detalhadas de entrada/saída para cada dia
- **Dias de Trabalho Flexíveis**: Personalize seus dias de trabalho (Seg-Dom)
- **Marcação de Feriado**: Marque feriados e registre automaticamente 7 horas
- **Cálculo de Horas Extras/Faltas**: Cálculo diário e semanal de horas extras/faltas

### 🔔 Notificações e Atualizações
- **Notificação de Entrada**: Notificação instantânea ao registrar entrada
- **Lembretes**: Notificações de lembrete automático após 6,5 e 7 horas
- **Notificação de Saída**: Notificação de resumo ao registrar saída
- **Verificação Automática de Atualização**: Verifica novas versões na inicialização do aplicativo

### 🔐 Segurança
- **Autenticação Firebase**: Suporte a Email/Senha e Login com Google
- **Exclusão de Conta**: Opção para excluir permanentemente sua conta e todos os dados
- **Regras Seguras do Firestore**: Usuários só podem acessar seus próprios dados
- **Validação de Dados**: Todos os dados passam por validação de formato

---

## 🚀 Instalação

### Requisitos

- Node.js 18+ 
- npm ou yarn
- Expo CLI
- Android Studio (para Android) ou Xcode (para iOS)

### Passos

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/ttimocin/ZeitLog.git
   cd ZeitLog
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configuração do Firebase**
   
   a. Vá para o [Firebase Console](https://console.firebase.google.com/)
   
   b. Crie um novo projeto
   
   c. Adicione "Web app" e obtenha as informações de configuração
   
   d. Crie o Firestore Database (você pode começar no modo Teste)
   
   e. Ative a Autenticação (Email/Senha e Google)
   
   f. Atualize a configuração em `config/firebase.ts`:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "SEU_PROJECT_ID.firebaseapp.com",
     projectId: "SEU_PROJECT_ID",
     storageBucket: "SEU_PROJECT_ID.appspot.com",
     messagingSenderId: "SEU_SENDER_ID",
     appId: "SEU_APP_ID"
   };
   ```
   
   g. Vá para a guia Firestore Rules no Firebase Console e cole as regras de `firestore.rules`

4. **Configuração do Google Sign-In (Opcional)**
   
   Baixe o `google-services.json` do Firebase Console e adicione-o ao diretório raiz do projeto para Android.

5. **Iniciar o aplicativo**
   ```bash
   # Servidor de desenvolvimento
   npm start
   
   # Para Android
   npm run android
   
   # Para iOS
   npm run ios
   ```

---

## 📱 Uso

### Tela Principal (Registro)

- **Botão Verde (ENTRADA)**: Registra seu horário de entrada
- **Botão Laranja (SAÍDA)**: Registra seu horário de saída
- **Cronômetro ao Vivo**: Sua duração de trabalho é exibida ao vivo após a entrada
- **Registros de Hoje**: Todos os registros feitos hoje são listados
  - ☁️ = Backup no Firebase
  - 📱 = Registro local apenas (ainda não sincronizado)

### Tela de Histórico

- **Visualização Semanal**: Horas de trabalho semanais em formato de tabela
- **Detalhes Diários**: Horários de entrada/saída e duração do trabalho para cada dia
- **Horas Extras/Faltas**: Exibição diária e semanal de horas extras/faltas
- **Feriado**: Clique nos dias para adicionar ou remover feriados

### Configurações

- **Seleção de Idioma**: Turco, Inglês, Alemão, Francês, Português, etc.
- **Tema**: Sistema, Claro, Escuro
- **Sincronização Firebase**: 
  - Backup na Nuvem: Envia registros pendentes para o Firebase
  - Carregar da Nuvem: Baixa registros do Firebase para o dispositivo local
- **Operações CSV**:
  - Baixar CSV: Compartilha todos os registros como arquivo CSV
  - Importar CSV: Carrega registros de arquivo CSV

---

## 🛠️ Tecnologias

- **React Native** (Expo) - Desenvolvimento móvel multiplataforma
- **TypeScript** - Segurança de tipo
- **Firebase** - Autenticação e Firestore
- **Expo Router** - Roteamento baseado em arquivos
- **AsyncStorage** - Armazenamento de dados local
- **Expo Notifications** - Gerenciamento de notificações
- **Expo File System & Sharing** - Exportação/Importação CSV

---

## 📁 Estrutura do Projeto

```
ZeitLog/
├── app/                      # Páginas Expo Router
│   ├── (tabs)/              # Navegação por abas
│   │   ├── index.tsx        # Tela principal de registro
│   │   └── explore.tsx      # Tela de histórico
│   ├── login.tsx            # Tela de login
│   ├── settings.tsx         # Tela de configurações
│   └── _layout.tsx         # Layout raiz
├── components/              # Componentes reutilizáveis
├── config/                 # Arquivos de configuração
├── context/                # Contextos React
├── services/               # Camada de serviço
├── types/                  # Tipos TypeScript
├── utils/                  # Funções auxiliares
├── i18n/                   # Suporte multi-idioma
├── firestore.rules         # Regras de segurança Firestore
└── app.json                # Configuração Expo
```

---

## 🔒 Segurança

- **Regras de Segurança do Firestore**: Usuários só podem acessar seus próprios dados
- **Autenticação**: Login seguro com Firebase Authentication
- **Validação de Dados**: Todos os dados passam por validação de formato
- **Privacidade**: Nenhum dado é compartilhado com terceiros

---

## 📦 Construindo APK

### Com EAS Build (Recomendado)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
```

### Build Local

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

---

## 🤝 Contribuição

Recebemos suas contribuições! Por favor, siga estes passos:

1. Faça um Fork do repositório
2. Crie uma branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

## 👨‍💻 Desenvolvedor

**TayTek**

- GitHub: [@ttimocin](https://github.com/ttimocin)

---

<div align="center">

**Rastreie suas horas de trabalho facilmente com ZeitLog!** ⏱️

Made with ❤️ by TayTek

</div>
