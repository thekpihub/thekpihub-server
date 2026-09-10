# Local Development

Run each component from its own directory.

```bash
cd apps/website
npm install
npm run build
```

```bash
cd apps/platform
npm install
npm run typecheck
npm run dev
```

```bash
cd archive/apps/legacy-app
npm install
npm run build
```

```bash
cd services/pipeline
pip install -r requirements.txt
python -m py_compile pipeline.py
```

```bash
cd archive/tools/automated-website-builder
npm install
npm test
```

