from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Estate, Property
from .serializers import EstateSerializer, LoginSerializer, PropertySerializer, RegistrationSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def root(request):
    return Response({
        'status': 'ok',
        'app': 'Safe Nyumba API',
        'message': 'API is running.',
        'endpoints': {
            'health': '/api/health/',
            'properties': '/api/properties/',
            'estates': '/api/estates/',
            'auth': '/api/auth/',
        },
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok'})


class PropertyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        properties = Property.objects.filter(vacant=True).select_related('estate')
        location = request.query_params.get('location', '').strip()
        if location:
            properties = properties.filter(Q(location__icontains=location) | Q(city__icontains=location))

        budget = request.query_params.get('budget')
        if budget:
            try:
                properties = properties.filter(rent__lte=int(budget))
            except ValueError:
                return Response({'budget': ['Enter a whole number.']}, status=status.HTTP_400_BAD_REQUEST)

        bedrooms = request.query_params.get('bedrooms')
        if bedrooms:
            try:
                bedroom_count = int(bedrooms)
            except ValueError:
                return Response({'bedrooms': ['Enter a whole number.']}, status=status.HTTP_400_BAD_REQUEST)
            if bedroom_count == 3:
                properties = properties.filter(bedrooms__gte=3)
            elif bedroom_count > 0:
                properties = properties.filter(bedrooms=bedroom_count)

        return Response(PropertySerializer(properties, many=True).data)


class EstateListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        estates = Estate.objects.prefetch_related('properties')
        return Response(EstateSerializer(estates, many=True).data)


class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(_auth_payload(user, token), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        user = authenticate(
            request,
            username=email,
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'detail': 'Email or password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(_auth_payload(user, token))


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user))


def _user_payload(user):
    return {
        'id': user.pk,
        'email': user.email,
        'full_name': user.first_name,
    }


def _auth_payload(user, token):
    return {'token': token.key, 'user': _user_payload(user)}
