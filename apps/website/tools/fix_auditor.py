# OBSOLETE: all three target strings below predate auditor.html's migration
# to the server-side ai-gateway.php flow and no longer exist in the file.
# Kept only as a historical record -- running it today is a harmless no-op
# (prints "NOT FOUND" three times and rewrites identical content).

with open('auditor.html', 'r') as f:
    content = f.read()

changes = 0

old1 = "model:'claude-sonnet-4-20250514', max_tokens:800,"
new1 = "model:'claude-sonnet-4-6', max_tokens:800,"
if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print("Fix 1 DONE - Line 307 updated to claude-sonnet-4-6")
else:
    print("Fix 1 NOT FOUND")

old2 = "      model: 'claude-haiku-4-5-20251001',"
new2 = "      model: 'claude-sonnet-4-6',"
if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("Fix 2 DONE - Haiku replaced with Sonnet")
else:
    print("Fix 2 NOT FOUND")

old3 = "      messages: [{ role: 'user', content: prompt }]"
new3 = "      system: [{ type: 'text', text: 'You are an expert SaaS KPI analyst for The KPI Hub. Provide CFO-grade insights and structured accurate analysis.', cache_control: { type: 'ephemeral', ttl: '1h' } }],\n      messages: [{ role: 'user', content: prompt }]"
if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print("Fix 3 DONE - cache_control 1h added")
else:
    print("Fix 3 NOT FOUND")

with open('auditor.html', 'w') as f:
    f.write(content)

print(str(changes) + " fix(es) saved to auditor.html")
