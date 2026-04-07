from django.db import models

class PromptTemplate(models.Model):
    title = models.CharField(max_length=255)
    shortcut = models.CharField(max_length=50, unique=True, help_text="e.g., //refactor")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title