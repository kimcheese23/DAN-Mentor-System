from locust import HttpUser, task, between

class MentorshipPlatformUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def test_mentor_discovery_api(self):
        self.client.get('/api/profile/mentors/?search=django')

class AuthenticatedUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        response = self.client.post("/api/auth/login/", json={
            "email": "saomai@gmail.com",
            "password": "123456"
        })
        if response.status_code == 200:
            token = response.json().get("access") or response.json().get("access_token")
            self.client.headers = {"Authorization": f"Bearer {token}"}

    @task
    def test_skills_api(self):
        self.client.get('/api/profile/skills/')