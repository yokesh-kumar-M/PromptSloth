from rest_framework import viewsets
from .models import PromptTemplate
from .serializers import PromptTemplateSerializer

class PromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer