package webChat.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import webChat.entity.ChatUser;
import webChat.model.chat.ChatUserDto;

@Mapper(componentModel = "spring")
public interface ChatUserMapper {
    ChatUserMapper INSTANCE = Mappers.getMapper(ChatUserMapper.class);

    ChatUserDto toDto(ChatUser e);
    ChatUser toEntity(ChatUserDto d);
}
