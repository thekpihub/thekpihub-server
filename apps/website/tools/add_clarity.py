import glob

CLARITY_ID = "wdshn14xgf"
CLARITY_SNIPPET = f"""
  <!-- ====== KPI Hub Analytics: Microsoft Clarity ====== -->
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){{
      c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    }})(window, document, "clarity", "script", "{CLARITY_ID}");
  </script>
  <!-- ====== End Clarity ====== -->
"""

html_files = glob.glob("*.html") + glob.glob("**/*.html", recursive=True)
injected = 0
for f in sorted(html_files):
    content = open(f, encoding='utf-8').read()
    if CLARITY_ID in content:
        print(f"  [SKIP] {f}")
        continue
    if '</head>' in content:
        content = content.replace('</head>', CLARITY_SNIPPET + '</head>', 1)
        open(f, 'w', encoding='utf-8').write(content)
        print(f"  [INJECTED] {f}")
        injected += 1
print(f"\n✅ Done — {injected} files injected")
