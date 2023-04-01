from django.test import TestCase
from django.utils import timezone
from accounts.models import Account
from .models import Server

class ServerTestCase(TestCase):
    def setUp(self):
        self.user = Account.objects.create(
            email='test@example.com',
            username='testuser',
            password='testpassword'
        )
        self.server = Server.objects.create(
            name='Test Server',
            creator=self.user,
            create_time=timezone.now()
        )
        
    def test_server_name(self):
        self.assertEqual(self.server.name, 'Test Server')
        
    def test_server_creator(self):
        self.assertEqual(self.server.creator, self.user)
        
    def test_server_create_time(self):
        self.assertTrue(timezone.now() >= self.server.create_time)
        
    def test_server_members(self):
        member = Account.objects.create(
            email='member@example.com',
            username='memberuser',
            password='memberpassword'
        )
        self.server.members.add(member)
        self.assertEqual(self.server.members.count(), 1)
        self.assertEqual(self.server.members.first(), member)