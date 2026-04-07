from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptTemplateViewSet, EnhancePromptView

router = DefaultRouter()
router.register(r'templates', PromptTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('enhance/', EnhancePromptView.as_view(), name='enhance-prompt'),
]