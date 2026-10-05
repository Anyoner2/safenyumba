from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Estate, Property


class PublicApiTests(APITestCase):
	def setUp(self):
		estate = Estate.objects.create(
			slug='kilimani',
			name='Kilimani',
			area='Nairobi',
			description='Central Nairobi neighbourhood.',
			image='https://example.com/kilimani.jpg',
		)
		Property.objects.create(
			slug='kilimani-two-bedroom',
			estate=estate,
			title='Kilimani apartment',
			location='Kilimani',
			city='Nairobi',
			rent=68000,
			bedrooms=2,
			amenity='Lift, security',
			kind='Apartment',
			verified=True,
			image='https://example.com/home.jpg',
			image_alt='A modern apartment',
		)
		Property.objects.create(
			slug='kilimani-three-bedroom',
			estate=estate,
			title='Kilimani family home',
			location='Kilimani',
			city='Nairobi',
			rent=110000,
			bedrooms=3,
			amenity='Garden, parking',
			kind='Townhouse',
			verified=True,
			image='https://example.com/family.jpg',
			image_alt='A family home',
		)

	def test_health_endpoint(self):
		response = self.client.get(reverse('api-health'))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data, {'status': 'ok'})

	def test_property_filters_and_frontend_field_names(self):
		response = self.client.get(
			reverse('api-properties'),
			{'location': 'Kilimani', 'budget': 80000, 'bedrooms': 2},
		)
		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]['id'], 'kilimani-two-bedroom')
		self.assertEqual(response.data[0]['imageAlt'], 'A modern apartment')

	def test_registration_login_and_token_profile(self):
		registration = self.client.post(
			reverse('api-register'),
			{
				'full_name': 'Amina Example',
				'email': 'amina@example.com',
				'password': 'Secure-house-pass-2030!',
			},
			format='json',
		)
		self.assertEqual(registration.status_code, 201)
		token = registration.data['token']
		self.assertTrue(Token.objects.filter(key=token).exists())
		self.assertEqual(get_user_model().objects.count(), 1)

		login = self.client.post(
			reverse('api-login'),
			{'email': 'AMINA@example.com', 'password': 'Secure-house-pass-2030!'},
			format='json',
		)
		self.assertEqual(login.status_code, 200)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
		profile = self.client.get(reverse('api-current-user'))
		self.assertEqual(profile.status_code, 200)
		self.assertEqual(profile.data['full_name'], 'Amina Example')
