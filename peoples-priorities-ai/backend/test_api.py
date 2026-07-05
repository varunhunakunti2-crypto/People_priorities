import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_json(data):
    print(json.dumps(data, indent=2))

def request_endpoint(method, path, payload=None):
    url = f"{BASE_URL}{path}"
    print(f"---> {method} {url}")
    
    headers = {}
    data = None
    if payload:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read()
            if response.headers.get_content_type() == 'application/json':
                print_json(json.loads(body.decode('utf-8')))
            else:
                print(f"[Binary or Non-JSON File Downloaded: {len(body)} bytes, Content-Type: {response.headers.get_content_type()}]")
            return body
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None

def main():
    print_section("1. GET /health")
    request_endpoint("GET", "/health")

    print_section("2. POST /submissions (Create new submission)")
    payload = {
        "raw_text": "The main drinking water pump in our village is completely rusted and broken for the last two months. We need immediate help.",
        "village_name": "Sultanpur",
        "channel": "whatsapp",
        "language_detected": "English"
    }
    res_body = request_endpoint("POST", "/submissions", payload)
    
    sub_id = None
    if res_body:
        sub_id = json.loads(res_body.decode('utf-8'))['submission_id']

    print_section("3. POST /submissions/process (Trigger NLP theme mapping)")
    if sub_id:
        request_endpoint("POST", "/submissions/process", {"submission_ids": [sub_id]})
    else:
        print("Skipping process step because submission creation failed.")

    print_section("4. GET /rankings (Fetch priorities with custom weights)")
    url = f"{BASE_URL}/rankings?weight_demand=0.8&weight_need=0.2"
    print(f"---> GET {url}")
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        # Truncate array to top 2 to keep output readable
        shape_demo = {"rankings": data['rankings'][:2]}
        print_json(shape_demo)
        print(f"... (truncated, array actually contains {len(data['rankings'])} elements)")

    print_section("5. GET /villages/{village_id} (Fetch nested village details)")
    url = f"{BASE_URL}/villages/VIL007" # VIL007 is Sultanpur
    print(f"---> GET {url}")
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        # Truncate nested arrays to 1 item to show JSON shape cleanly
        if len(data.get('submissions', [])) > 1: data['submissions'] = data['submissions'][:1]
        if len(data.get('existing_works', [])) > 1: data['existing_works'] = data['existing_works'][:1]
        if len(data.get('schools', [])) > 1: data['schools'] = data['schools'][:1]
        print_json(data)
        print("... (nested arrays truncated to show shape)")

    print_section("6. GET /export?format=pdf (Download PDF Report)")
    request_endpoint("GET", "/export?format=pdf")

if __name__ == "__main__":
    main()
