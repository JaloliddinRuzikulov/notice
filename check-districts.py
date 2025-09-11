import json

with open('/home/user/data/employees.json', 'r') as f:
    employees = json.load(f)

districts = {}
for emp in employees:
    district = emp.get('district', 'empty')
    if district == '':
        district = 'empty'
    districts[district] = districts.get(district, 0) + 1

print("District distribution:")
for k, v in sorted(districts.items()):
    print(f"  {k}: {v} employees")

print("\nEmployees in district 11:")
for emp in employees:
    if emp.get('district') == '11':
        print(f"  - {emp['name']}")

print("\nEmployees in district 'Shahrisabz tumani':")
for emp in employees:
    if emp.get('district') == 'Shahrisabz tumani':
        print(f"  - {emp['name']}")