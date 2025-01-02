This is a [Next.js](https://nextjs.org) project bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

## 🚀 Getting Started

Follow these steps to set up and run this project locally:

### 1. **Set Up a Virtual Environment** (Recommended)
To keep dependencies isolated, it's recommended to use a virtual environment.

#### (1) **Create a Virtual Environment**
```bash
python3 -m venv myenv
```

#### (2) **Activate the Virtual Environment**
```bash
source myenv/bin/activate   # For macOS/Linux
# .\myenv\Scripts\activate  # For Windows
```

---

### 2. **Clone the Repository**
First, clone this repository to your local machine:

```bash
git clone https://github.com/Eunbi-Cho/naver_eval.git
cd naver_eval
```

---

### 3. **Install Dependencies**
Make sure you have Node.js installed (version 16 or later is recommended). Install the required packages using one of the following commands:

#### (1) **For Node.js Projects**
```bash
npm install next react react-dom
```

#### (2) **For Python Projects**
If a `requirements.txt` file is present, install Python dependencies with:

```bash
pip install -r requirements.txt
```

This will download and set up all the dependencies listed in the respective files.

---

### 4. **Start the Development Server**
Run the development server with one of these commands:

```bash
npm run dev
```

Once the server starts, open your browser and visit:

[http://localhost:3000](http://localhost:3000)

Here, you can see the project in action. Any changes you make to the code will automatically reflect on the page.

---

### **Dependencies Not Installed Correctly**
If the project doesn't start due to missing packages, try deleting the `node_modules` folder and `package-lock.json` file, then reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

