import { Alert, AlertIcon, Flex, Icon, Text } from '@chakra-ui/react';
import React, { useState } from 'react'
import { BiPoll } from "react-icons/bi";
import { BsLink45Deg, BsMic } from "react-icons/bs";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import TextInputs from './PostForm/TextInputs';
import ImageUpload from './PostForm/ImageUpload';
import { Post } from '../../atoms/postsAtom';
import { User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { addDoc, collection, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '../../firebase/clientApp';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import useSelectFile from '../../hooks/useSelectFile';
import TabItem from './TabItem';


const formTabs = [
    {
        title: 'Post',
        icon: IoDocumentText
    },
    {
        title: 'Images & Video',
        icon: IoImageOutline
    },
    {
        title: 'Link',
        icon: BsLink45Deg
    },
    {
        title: 'Poll',
        icon: BiPoll
    },
    {
        title: 'Talk',
        icon: BsMic
    },
];



type NewPostFormProps = {
    user: User;
    communityImageURL?: string;
    communityId?: string;
};


const NewPostForm: React.FC<NewPostFormProps> = ({ user, communityImageURL, communityId }) => {
    const router = useRouter();

    const [selectedTab, setSelectedTab] = useState(formTabs[0].title);

    const [textInputs, setTextInputs] = useState({
        title: '',
        body: '',
    });

    const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);


    const handleCreatePost = async () => {
        const { communityId } = router.query;
        // create new post object =>  type Post
        const newPost: Post = {
            communityId: communityId as string,
            communityImageURL: communityImageURL || '',
            creatorId: user.uid,
            creatorDisplayName: user.email!.split('@')[0],
            title: textInputs.title,
            body: textInputs.body,
            numberOfComments: 0,
            voteStatus: 0,
            createdAt: serverTimestamp() as Timestamp,
        };
        // store post in our db
        setLoading(true);
        try {
            const postDocRef = await addDoc(collection(firestore, 'posts'), newPost)

            // check for selectedFile
            // store in storage => getDownloadURL (return imageURL)
            // update post doc by adding imageURL
            if (selectedFile) {
                const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
                await uploadString(imageRef, selectedFile, 'data_url');
                const downloadURL = await getDownloadURL(imageRef);

                await updateDoc(postDocRef, {
                    imageURL: downloadURL,
                })
            }
            router.back();
        } catch (error: any) {
            console.log('handleCreatePost error', error.message);
            setError(true);
        }

        setLoading(false);

        // redirect the user back to the communityPage using the router


    }

    const onTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { target: { name, value },
        } = event;
        setTextInputs(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <Flex direction='column' bg='white' borderRadius={4} mt={2}>
            <Flex width='100%'>
                {formTabs.map((item, index) => (
                    <TabItem
                        key={index}
                        item={item}
                        selected={item.title === selectedTab}
                        setSelectedTab={setSelectedTab}
                    />
                ))}
            </Flex>
            <Flex p={4}>
                {selectedTab === "Post" && (<TextInputs textInputs={textInputs} handleCreatePost={handleCreatePost} onChange={onTextChange} loading={loading} />)}
                {selectedTab === 'Images & Video' && <ImageUpload selectedFile={selectedFile} onSelectImage={onSelectFile} setSelectedTab={setSelectedTab} setSelectedFile={setSelectedFile} />}
            </Flex>
            {error && (
                <Alert status='error'>
                    <AlertIcon />
                    <Text mr={2}>Error creating post</Text>
                </Alert>
            )}
        </Flex>
    )
}
export default NewPostForm;