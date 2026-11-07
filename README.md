# Password Generator PRO

A professional, client-side password generator built with Vanilla JavaScript. Designed for security, speed, and a premium user experience.

## Features

- **Cryptographically Secure:** Uses `crypto.getRandomValues()` with modulo bias protection.
- **Pwned Password Check:** Integrates with the HaveIBeenPwned API (k-anonymity) to ensure generated passwords are not leaked.
- **Pattern Detection:** Rejects passwords with common weak sequences (e.g., `123`, `qwerty`).
- **Customizable:** Choose character sets, exclude ambiguous symbols, and set a specific password length.
- **Batch Generation:** Generate up to 100 unique passwords at once.
- **Entropy & Crack Time:** Real-time calculation of password strength in bits and estimated crack time.
- **Fully Client-Side:** No data is sent to a server (except the first 5 chars of a SHA-1 hash for the Pwned check).
- **Dark Mode UI:** A clean, modern, and responsive interface.

## Tech Stack

- **HTML5:** Semantic structure.
- **CSS3:** Custom properties, Flexbox, and responsive design.
- **Vanilla JavaScript:** No frameworks, no dependencies. Pure ES6+.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/AlexBaldEagle/password-generator-pro.git