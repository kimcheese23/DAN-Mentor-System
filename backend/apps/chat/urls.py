from django.urls import path
from .views import ConversationListView, MessageListView

urlpatterns = [
    path('conversations/',ConversationListView.as_view()),
    path('conversations/<int:pk>/messages/',MessageListView.as_view()),
]