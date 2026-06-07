# Author's Note (NOT AI GENERATED)

> Do you also find it annoying to track your xbox controller battery using the default bluetooth ui on windows.
> Well you install XBat (get it x-box and battery. I will take whole credit for this cz AI could have probably come up with something better) this and see the changes in battery life for your xbox controller in real time sorta (windows doesnt have drivers to track it very accurately).
> Any and all contributions are greatly appreciated. CIAO.

# XBat — Premium Xbox Controller Tracker

**XBat** is a minimalist, glassmorphism-style desktop widget for Windows that tracks your Xbox controller's battery life and session performance in real-time. Built with Electron and XInput, it's designed for gamers who want a high-end, unobtrusive way to monitor their gear.

---

## ✨ Features

*   **🔋 Real-time Battery Monitoring**: Precise tracking for wired and wireless controllers.
*   **📡 Bluetooth Fallback**: Custom PowerShell integration to accurately report battery levels when standard XInput fail (e.g., for Bluetooth-connected controllers).
*   **🕒 Session Analytics**: Track exactly how long you've played and monitor battery drain percentage per session.
*   **📜 Performance History**: View a detailed log of past sessions to see how your battery sets are performing over time.
*   **🔲 Smooth Resizing**: A flexible, responsive UI that scales to your preferred desktop size.
*   **🌙 Glassmorphism Design**: A premium, transparent dark-mode aesthetic that blends perfectly with modern Windows.
*   **📥 Minimize to Tray**: Runs as a lightweight background service; just double-click the tray icon to show/hide.

---

## 🚀 Getting Started

### Prerequisites
*   Windows 10 or 11
*   [Node.js](https://nodejs.org/) (v16+)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/PiyushMishra318/xbat.git
    cd xbat
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the application**:
    ```bash
    npm start
    ```

---

## 🛠 Building for Windows

To generate a **portable EXE** (no installation required):
```bash
npm run dist
```
The output will be in the `dist/` folder.

---

## 📋 Roadmap
- [ ] Customizable theme accents (Blue, Red, Purple).
- [ ] Low battery desktop notifications.
- [ ] Support for multiple simultaneous controllers in one view.
- [ ] CSV export for battery performance data.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Contact
**PiyushMishra** - [@PiyushMishra318](https://github.com/PiyushMishra318)

Project Link: [https://github.com/PiyushMishra318/xbat](https://github.com/PiyushMishra318/xbat)

---

## 🙏 Acknowledgments
*   [xinput-ffi](https://www.npmjs.com/package/xinput-ffi)
*   [Electron Builder](https://www.electron.build/)
*   [Inter Font Family](https://fonts.google.com/specimen/Inter)
