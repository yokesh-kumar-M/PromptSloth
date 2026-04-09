from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptTemplateViewSet

router = DefaultRouter()
router.register(r'templates', PromptTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]