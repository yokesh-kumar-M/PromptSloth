from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PromptTemplate
from .serializers import PromptTemplateSerializer
from .llm_handler import enhance_text

class PromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer

class EnhancePromptView(APIView):
    def post(self, request):
        raw_prompt = request.data.get('raw_prompt')
        if not raw_prompt:
            return Response({"error": "No raw_prompt provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            enhanced = enhance_text(raw_prompt)
            return Response({"enhanced_prompt": enhanced}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)