from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class BasePaginator:
    pagination_class = PageNumberPagination

    def paginate_list(self, request, queryset, serializer_class, context=None):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)

        serializer_context = {'request': request}
        if context and isinstance(context, dict):
            serializer_context.update(context)

        if page is not None:
            serializer = serializer_class(page, many=True, context=serializer_context)
            return paginator.get_paginated_response(serializer.data)

        serializer = serializer_class(queryset, many=True, context=serializer_context)
        return Response(serializer.data)