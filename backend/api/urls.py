from django.urls import path

from .views import (
    CurrentUserView,
    EstateListView,
    LoginView,
    LogoutView,
    PropertyListView,
    RegistrationView,
    health,
)

urlpatterns = [
    path('health/', health, name='api-health'),
    path('properties/', PropertyListView.as_view(), name='api-properties'),
    path('estates/', EstateListView.as_view(), name='api-estates'),
    path('auth/register/', RegistrationView.as_view(), name='api-register'),
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='api-current-user'),
]