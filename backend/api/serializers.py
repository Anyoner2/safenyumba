from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Estate, Property

User = get_user_model()


class EstateSerializer(serializers.ModelSerializer):
    homes = serializers.SerializerMethodField()

    class Meta:
        model = Estate
        fields = ['slug', 'name', 'area', 'homes', 'description', 'image']

    def get_homes(self, estate):
        return estate.properties.filter(verified=True, vacant=True).count()


class PropertySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug', read_only=True)
    imageAlt = serializers.CharField(source='image_alt', read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'location', 'city', 'rent', 'bedrooms', 'amenity',
            'kind', 'verified', 'vacant', 'image', 'imageAlt',
        ]


class RegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_full_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError('Enter your full name.')
        return name

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data['email']
        return User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data['full_name'],
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)